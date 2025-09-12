import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { ref, onValue, update, remove } from 'firebase/database';
import { database } from '../lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { WalletRequest, SupportTicket, User } from '@shared/schema';

const Admin: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('wallet-requests');
  const [walletRequests, setWalletRequests] = useState<WalletRequest[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.role !== 'admin') return;

    // Listen to wallet requests
    const walletRequestsRef = ref(database, 'walletRequests');
    const unsubscribeWalletRequests = onValue(walletRequestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const requests: WalletRequest[] = Object.entries(data).map(([id, request]: [string, any]) => ({
          id,
          ...request,
          createdAt: new Date(request.createdAt),
          processedAt: request.processedAt ? new Date(request.processedAt) : undefined
        }));
        setWalletRequests(requests.filter(r => r.status === 'pending'));
      } else {
        setWalletRequests([]);
      }
    });

    // Listen to support tickets
    const supportTicketsRef = ref(database, 'supportTickets');
    const unsubscribeSupportTickets = onValue(supportTicketsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const tickets: SupportTicket[] = Object.entries(data).map(([id, ticket]: [string, any]) => ({
          id,
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
          resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : undefined
        }));
        setSupportTickets(tickets.filter(t => t.status === 'open' || t.status === 'in_progress'));
      } else {
        setSupportTickets([]);
      }
    });

    // Listen to users
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersList: User[] = Object.entries(data).map(([id, user]: [string, any]) => ({
          id,
          ...user,
          joinDate: new Date(user.joinDate),
          lastActive: user.lastActive ? new Date(user.lastActive) : undefined
        }));
        setUsers(usersList);
      } else {
        setUsers([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeWalletRequests();
      unsubscribeSupportTickets();
      unsubscribeUsers();
    };
  }, [userProfile]);

  const handleApproveWalletRequest = async (requestId: string, request: WalletRequest) => {
    try {
      const updates = {
        [`walletRequests/${requestId}/status`]: 'approved',
        [`walletRequests/${requestId}/adminId`]: userProfile?.id,
        [`walletRequests/${requestId}/processedAt`]: new Date().toISOString(),
        [`users/${request.userId}/walletBalance`]: (users.find(u => u.id === request.userId)?.walletBalance || 0) + request.amountAfterFee
      };

      await update(ref(database), updates);

      // Add transaction record
      const transactionRef = ref(database, `walletTransactions/${Date.now()}`);
      await update(transactionRef, {
        userId: request.userId,
        type: 'topup',
        amount: request.amountAfterFee,
        description: `Wallet top-up approved (Request #${requestId})`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      toast({
        title: "Success",
        description: "Wallet request approved successfully!"
      });
    } catch (error) {
      console.error('Error approving wallet request:', error);
      toast({
        title: "Error",
        description: "Failed to approve wallet request.",
        variant: "destructive"
      });
    }
  };

  const handleRejectWalletRequest = async (requestId: string, reason?: string) => {
    try {
      const updates = {
        [`walletRequests/${requestId}/status`]: 'rejected',
        [`walletRequests/${requestId}/adminId`]: userProfile?.id,
        [`walletRequests/${requestId}/adminNotes`]: reason || 'Request rejected by admin',
        [`walletRequests/${requestId}/processedAt`]: new Date().toISOString()
      };

      await update(ref(database), updates);

      toast({
        title: "Success",
        description: "Wallet request rejected."
      });
    } catch (error) {
      console.error('Error rejecting wallet request:', error);
      toast({
        title: "Error",
        description: "Failed to reject wallet request.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'vip' | 'admin') => {
    try {
      await update(ref(database, `users/${userId}`), { role: newRole });
      
      toast({
        title: "Success",
        description: `User role updated to ${newRole}.`
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive"
      });
    }
  };

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      await update(ref(database, `users/${userId}`), { isBanned: ban });
      
      toast({
        title: "Success",
        description: `User ${ban ? 'banned' : 'unbanned'} successfully.`
      });
    } catch (error) {
      console.error('Error updating user ban status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive"
      });
    }
  };

  if (userProfile?.role !== 'admin') {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Alert variant="destructive">
            <AlertDescription>
              Access denied. Admin privileges required.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'open': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
              <p className="text-muted-foreground">Manage users, orders, and platform operations</p>
            </div>
            <Badge variant="destructive" className="bg-red-600/20 text-red-400 px-4 py-2">
              <i className="fas fa-shield-alt mr-2"></i>
              Admin Access
            </Badge>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-12">
          <Card data-testid="total-users-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-blue-400 text-xl"></i>
                </div>
                <span className="text-2xl font-bold">{users.length}</span>
              </div>
              <h3 className="font-semibold mb-1">Total Users</h3>
              <p className="text-sm text-green-400">
                +{users.filter(u => new Date(u.joinDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} this week
              </p>
            </CardContent>
          </Card>

          <Card data-testid="pending-requests-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-400 text-xl"></i>
                </div>
                <span className="text-2xl font-bold">{walletRequests.length}</span>
              </div>
              <h3 className="font-semibold mb-1">Pending Requests</h3>
              <p className="text-sm text-muted-foreground">Wallet & withdrawals</p>
            </CardContent>
          </Card>

          <Card data-testid="open-tickets-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                </div>
                <span className="text-2xl font-bold">{supportTickets.length}</span>
              </div>
              <h3 className="font-semibold mb-1">Open Tickets</h3>
              <p className="text-sm text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card data-testid="vip-users-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-crown text-purple-400 text-xl"></i>
                </div>
                <span className="text-2xl font-bold">{users.filter(u => u.role === 'vip').length}</span>
              </div>
              <h3 className="font-semibold mb-1">VIP Users</h3>
              <p className="text-sm text-muted-foreground">Premium members</p>
            </CardContent>
          </Card>

          <Card data-testid="banned-users-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-ban text-red-400 text-xl"></i>
                </div>
                <span className="text-2xl font-bold">{users.filter(u => u.isBanned).length}</span>
              </div>
              <h3 className="font-semibold mb-1">Banned Users</h3>
              <p className="text-sm text-muted-foreground">Restricted accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="wallet-requests" data-testid="wallet-requests-tab">
                  Wallet Requests ({walletRequests.length})
                </TabsTrigger>
                <TabsTrigger value="user-management" data-testid="user-management-tab">
                  User Management
                </TabsTrigger>
                <TabsTrigger value="support-tickets" data-testid="support-tickets-tab">
                  Support Tickets ({supportTickets.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="wallet-requests" className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Pending Wallet Requests</h3>
                  <Button variant="secondary" size="sm">
                    <i className="fas fa-download mr-1"></i>
                    Export
                  </Button>
                </div>

                {walletRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-green-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">No pending wallet requests to review.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {walletRequests.map((request) => {
                      const user = users.find(u => u.id === request.userId);
                      return (
                        <Card key={request.id} className="border border-border">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                    <span className="text-xs text-primary-foreground">
                                      {user?.username[0]?.toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold">{user?.username}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Level {user?.level} • {user?.totalTrades} total trades
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Type:</span>
                                    <p className={`font-medium ${request.type === 'topup' ? 'text-green-400' : 'text-red-400'}`}>
                                      {request.type === 'topup' ? 'Top-up' : 'Withdrawal'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Amount:</span>
                                    <p className="font-medium text-primary">${request.amount.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">After Fee:</span>
                                    <p className="font-medium text-green-400">${request.amountAfterFee.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={getStatusColor(request.status)}>
                                  {request.status}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {new Date(request.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveWalletRequest(request.id, request)}
                                data-testid={`approve-request-${request.id}`}
                              >
                                <i className="fas fa-check mr-1"></i>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectWalletRequest(request.id)}
                                data-testid={`reject-request-${request.id}`}
                              >
                                <i className="fas fa-times mr-1"></i>
                                Reject
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="user-management" className="space-y-4">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-4">User Management</h3>
                </div>

                <div className="space-y-4">
                  {users.slice(0, 10).map((user) => (
                    <Card key={user.id} className="border border-border">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary-foreground">
                                {user.username[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-semibold">{user.username}</p>
                                <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'vip' ? 'default' : 'secondary'}>
                                  {user.role}
                                </Badge>
                                {user.isBanned && <Badge variant="destructive">Banned</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Level {user.level} • ${user.walletBalance.toFixed(2)} • {user.totalTrades} trades
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateUserRole(user.id, user.role === 'vip' ? 'user' : 'vip')}
                              data-testid={`toggle-vip-${user.id}`}
                            >
                              {user.role === 'vip' ? 'Remove VIP' : 'Make VIP'}
                            </Button>
                            <Button
                              size="sm"
                              variant={user.isBanned ? 'default' : 'destructive'}
                              onClick={() => handleBanUser(user.id, !user.isBanned)}
                              data-testid={`toggle-ban-${user.id}`}
                            >
                              {user.isBanned ? 'Unban' : 'Ban'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="support-tickets" className="space-y-4">
                <div className="mb-6">
                  <h3 className="text-xl font-bold">Open Support Tickets</h3>
                </div>

                {supportTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-green-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">No open support tickets to review.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supportTickets.map((ticket) => {
                      const user = users.find(u => u.id === ticket.userId);
                      return (
                        <Card key={ticket.id} className="border border-border">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-semibold mb-1">{ticket.subject}</h4>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                                  <span>#{ticket.id}</span>
                                  <span>{ticket.category}</span>
                                  <span>{user?.username}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{ticket.description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className={getStatusColor(ticket.status)}>
                                  {ticket.status.replace('_', ' ')}
                                </Badge>
                                <Badge className={`text-xs ${ticket.priority === 'high' ? 'bg-red-500/20 text-red-400' : 
                                  ticket.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                                  'bg-green-500/20 text-green-400'}`}>
                                  {ticket.priority}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Button size="sm" variant="outline">
                                <i className="fas fa-reply mr-1"></i>
                                Reply
                              </Button>
                              <Button size="sm" variant="outline">
                                <i className="fas fa-check mr-1"></i>
                                Mark Resolved
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
