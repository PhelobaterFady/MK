import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { database } from '@/lib/firebase';
import { ref, onValue, off, get } from 'firebase/database';
import { getUser } from '@/services/firebase-api';
import { formatCurrencySymbol } from '@/utils/currency';

interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  accountId: string;
  gameAccountTitle: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  accountDetails?: any;
}

const PendingMoney: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'escrow' | 'delivering' | 'awaiting_confirmation'>('all');
  const [userData, setUserData] = useState<{[key: string]: any}>({});

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const ordersRef = ref(database, 'orders');
        const snapshot = await get(ordersRef);
        
        if (!snapshot.exists()) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const ordersData = snapshot.val();
        const ordersList: Order[] = Object.entries(ordersData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          createdAt: new Date(data.createdAt).toISOString(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt).toISOString() : undefined
        }));

        // Filter for pending money orders
        const pendingOrders = ordersList.filter(order => 
          ['escrow', 'delivering', 'awaiting_confirmation'].includes(order.status)
        );

        // Sort by creation date (newest first)
        pendingOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(pendingOrders);

        // Load user data for orders
        const userIds = new Set<string>();
        pendingOrders.forEach(order => {
          userIds.add(order.buyerId);
          userIds.add(order.sellerId);
        });
        
        const userDataMap: {[key: string]: any} = {};
        for (const userId of userIds) {
          try {
            const user = await getUser(userId);
            userDataMap[userId] = user;
          } catch (error) {
            console.error('Error fetching user data:', error);
            userDataMap[userId] = { displayName: 'Unknown User', email: 'No email' };
          }
        }
        setUserData(userDataMap);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();

    // Listen for real-time updates
    const ordersRef = ref(database, 'orders');
    const unsubscribe = onValue(ordersRef, () => {
      loadOrders();
    });

    return () => {
      off(ordersRef);
    };
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.gameAccountTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userData[order.buyerId]?.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userData[order.sellerId]?.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'escrow':
        return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Awaiting Account Details</Badge>;
      case 'delivering':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Delivering</Badge>;
      case 'awaiting_confirmation':
        return <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">Awaiting Confirmation</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTotalPendingAmount = () => {
    return filteredOrders.reduce((total, order) => total + (order.price || 0), 0);
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
      {/* Summary Card */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="text-orange-800">
            <i className="fas fa-clock mr-2"></i>
            Pending Money Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrencySymbol(getTotalPendingAmount())}
              </div>
              <p className="text-sm text-orange-700">Total Pending Amount</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredOrders.length}
              </div>
              <p className="text-sm text-orange-700">Active Orders</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {orders.filter(o => o.status === 'escrow').length}
              </div>
              <p className="text-sm text-orange-700">Awaiting Account Details</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Money Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Input
              placeholder="Search by order ID, account name, buyer or seller..."
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
              <option value="escrow">Awaiting Account Details</option>
              <option value="delivering">Delivering</option>
              <option value="awaiting_confirmation">Awaiting Confirmation</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredOrders.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <i className="fas fa-inbox text-4xl mb-4"></i>
                <p className="text-lg font-semibold mb-2">No pending money orders found</p>
                <p className="text-sm">No orders match your current filters.</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{order.gameAccountTitle || 'Game Account Order'}</h3>
                            {getStatusBadge(order.status)}
                          </div>
                          
                          {/* Order Information */}
                          <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2">Order Information</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <strong>Order ID:</strong> #{order.id}
                              </div>
                              <div>
                                <strong>Amount:</strong> {formatCurrencySymbol(order.price || 0)}
                              </div>
                              <div>
                                <strong>Buyer:</strong> {userData[order.buyerId]?.displayName || 'Unknown'}
                              </div>
                              <div>
                                <strong>Seller:</strong> {userData[order.sellerId]?.displayName || 'Unknown'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div>
                              <strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            {order.updatedAt && (
                              <div>
                                <strong>Updated:</strong> {new Date(order.updatedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {order.accountDetails && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <h4 className="font-semibold text-sm mb-2 text-blue-800 flex items-center">
                                <i className="fas fa-key mr-2"></i>
                                Account Details Provided
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                                <div><strong>Username:</strong> {order.accountDetails.username || 'Not provided'}</div>
                                <div><strong>Email:</strong> {order.accountDetails.email || 'Not provided'}</div>
                                {order.accountDetails.recoveryEmail && (
                                  <div><strong>Recovery Email:</strong> {order.accountDetails.recoveryEmail}</div>
                                )}
                                {order.accountDetails.phoneNumber && (
                                  <div><strong>Phone:</strong> {order.accountDetails.phoneNumber}</div>
                                )}
                                {order.accountDetails.twoFactorAuth && (
                                  <div><strong>2FA:</strong> {order.accountDetails.twoFactorAuth}</div>
                                )}
                                {order.accountDetails.securityQuestions && (
                                  <div className="md:col-span-2">
                                    <strong>Security Questions:</strong> {order.accountDetails.securityQuestions}
                                  </div>
                                )}
                                {order.accountDetails.additionalInfo && (
                                  <div className="md:col-span-2">
                                    <strong>Additional Info:</strong> {order.accountDetails.additionalInfo}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-600">
                              {formatCurrencySymbol(order.price || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">Pending Amount</p>
                          </div>
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
    </div>
  );
};

export default PendingMoney;
