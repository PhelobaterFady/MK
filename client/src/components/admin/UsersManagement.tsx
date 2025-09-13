import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { database } from '@/lib/firebase';
import { ref, onValue, off, get, update } from 'firebase/database';
import { getUser } from '@/services/firebase-api';
// import UserDetailsModal from './UserDetailsModal';
import UserChatsModal from './UserChatsModal';

interface User {
  uid: string;
  email: string;
  username: string;
  walletBalance: number;
  accountLevel: number;
  isDisabled: boolean;
  createdAt: string;
  lastLogin?: string;
}

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showUserChats, setShowUserChats] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        
        if (!snapshot.exists()) {
          setUsers([]);
          setLoading(false);
          return;
        }

        const usersData = snapshot.val();
        const usersList: User[] = Object.entries(usersData).map(([uid, data]: [string, any]) => ({
          uid,
          ...data
        }));

        // Sort by creation date (newest first)
        usersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setUsers(usersList);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();

    // Listen for real-time updates
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, () => {
      loadUsers();
    });

    return () => {
      off(usersRef);
    };
  }, []);

  const handleDisableUser = async (userId: string, disable: boolean) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, {
        isDisabled: disable,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getLevelBadge = (level: number) => {
    if (level >= 1 && level <= 10) {
      return <Badge variant="secondary" className="bg-gray-500">Iron</Badge>;
    } else if (level >= 11 && level <= 30) {
      return <Badge variant="default" className="bg-orange-600">Bronze</Badge>;
    } else if (level >= 31 && level <= 60) {
      return <Badge variant="default" className="bg-yellow-500">Gold</Badge>;
    } else if (level >= 61 && level <= 99) {
      return <Badge variant="default" className="bg-purple-500">Platinum</Badge>;
    } else if (level >= 100 && level <= 150) {
      return <Badge variant="default" className="bg-blue-500">Diamond</Badge>;
    } else if (level >= 151 && level <= 200) {
      return <Badge variant="default" className="bg-green-500">Emerald</Badge>;
    } else if (level >= 201 && level <= 250) {
      return <Badge variant="default" className="bg-red-500">Ruby</Badge>;
    } else {
      return <Badge variant="default" className="bg-red-600">Max</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Input
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <i className="fas fa-users text-4xl mb-4"></i>
                <p className="text-lg font-semibold mb-2">No users found</p>
                <p className="text-sm">No users match your current search.</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredUsers.map((user) => (
                  <Card key={user.uid} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{user.username}</h3>
                            {getLevelBadge(user.accountLevel)}
                            {user.isDisabled && (
                              <Badge variant="destructive">Disabled</Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <strong>Email:</strong> {user.email}
                            </div>
                            <div>
                              <strong>Wallet:</strong> ${user.walletBalance?.toFixed(2) || '0.00'}
                            </div>
                            <div>
                              <strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              <strong>Last Login:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserDetails(true);
                            }}
                          >
                            <i className="fas fa-eye mr-1"></i>
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowUserChats(true);
                            }}
                          >
                            <i className="fas fa-comments mr-1"></i>
                            View Chats
                          </Button>
                          <Button
                            size="sm"
                            variant={user.isDisabled ? "default" : "destructive"}
                            onClick={() => handleDisableUser(user.uid, !user.isDisabled)}
                          >
                            <i className={`fas ${user.isDisabled ? 'fa-unlock' : 'fa-lock'} mr-1`}></i>
                            {user.isDisabled ? 'Enable' : 'Disable'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedUser && (
        <>
          {/* <UserDetailsModal
            user={selectedUser}
            isOpen={showUserDetails}
            onClose={() => setShowUserDetails(false)}
          /> */}
          <UserChatsModal
            user={selectedUser}
            isOpen={showUserChats}
            onClose={() => setShowUserChats(false)}
          />
        </>
      )}
    </div>
  );
};

export default UsersManagement;
