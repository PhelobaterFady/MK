import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { database } from '@/lib/firebase';
import { ref, onValue, off, get, update } from 'firebase/database';
import { getUser } from '@/services/firebase-api';
import { formatCurrencySymbol } from '@/utils/currency';

interface WithdrawRequest {
  id: string;
  userId: string;
  amount: number;
  phoneNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
}

const WithdrawRequests: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const requestsRef = ref(database, 'withdrawRequests');
        const snapshot = await get(requestsRef);
        
        if (!snapshot.exists()) {
          setRequests([]);
          setLoading(false);
          return;
        }

        const requestsData = snapshot.val();
        const requestsList: WithdrawRequest[] = Object.entries(requestsData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));

        // Sort by creation date (newest first)
        requestsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(requestsList);
      } catch (error) {
        console.error('Error loading withdraw requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();

    // Listen for real-time updates
    const requestsRef = ref(database, 'withdrawRequests');
    const unsubscribe = onValue(requestsRef, () => {
      loadRequests();
    });

    return () => {
      off(requestsRef);
    };
  }, []);

  const handleStatusChange = async (requestId: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    try {
      const requestRef = ref(database, `withdrawRequests/${requestId}`);
      await update(requestRef, {
        status,
        updatedAt: new Date().toISOString(),
        adminNotes: adminNotes || ''
      });

      // If approved, deduct amount from user's wallet
      if (status === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          const userRef = ref(database, `users/${request.userId}`);
          const userSnapshot = await get(userRef);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            const currentBalance = userData.walletBalance || 0;
            const newBalance = Math.max(0, currentBalance - request.amount);
            
            await update(userRef, {
              walletBalance: newBalance,
              lastUpdated: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.amount.toString().includes(searchTerm) ||
                         request.userData?.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userData?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.instapayUser?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.country?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
          <CardTitle>Withdraw Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Input
              placeholder="Search by phone number or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredRequests.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <i className="fas fa-inbox text-4xl mb-4"></i>
                <p className="text-lg font-semibold mb-2">No withdraw requests found</p>
                <p className="text-sm">No requests match your current filters.</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{formatCurrencySymbol(request.amount)}</h3>
                            {getStatusBadge(request.status)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <strong>Country:</strong> 
                              <span className="ml-1 font-medium">
                                {request.country === 'egypt' ? 'Egypt' : 'Outside Egypt'}
                              </span>
                            </div>
                            <div>
                              <strong>Payment Method:</strong> 
                              <span className="ml-1 font-medium">
                                {request.paymentMethod === 'instapay' ? 'Instapay' : 
                                 request.paymentMethod === 'usdt' ? 'USDT' : 
                                 request.paymentMethod || 'N/A'}
                              </span>
                            </div>
                            {request.instapayUser && (
                              <div>
                                <strong>Instapay Username:</strong> 
                                <span className="ml-1 font-medium">{request.instapayUser}</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <strong>Date:</strong> {new Date(request.createdAt).toLocaleDateString()}
                            </div>
                            <div>
                              <strong>After Fee:</strong> {formatCurrencySymbol(request.amount * 0.95)}
                            </div>
                          </div>

                          {request.adminNotes && (
                            <div className="mt-3">
                              <strong className="text-sm">Admin Notes:</strong>
                              <p className="text-sm text-muted-foreground mt-1">{request.adminNotes}</p>
                            </div>
                          )}
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(request.id, 'approved')}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <i className="fas fa-check mr-1"></i>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const notes = prompt('Enter rejection reason (optional):');
                                handleStatusChange(request.id, 'rejected', notes || undefined);
                              }}
                            >
                              <i className="fas fa-times mr-1"></i>
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawRequests;
