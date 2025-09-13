import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { database } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { formatCurrencySymbol } from '@/utils/currency';

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

interface UserDetailsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  accountId: string;
  accountTitle: string;
  price: number;
  status: string;
  createdAt: string;
}

interface PaymentRequest {
  id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  phoneNumber?: string;
  receiptImage?: string;
  adminNotes?: string;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [depositRequests, setDepositRequests] = useState<PaymentRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const loadUserData = async () => {
      try {
        setLoading(true);

        // Load orders
        const ordersRef = ref(database, 'orders');
        const ordersSnapshot = await get(ordersRef);
        let userOrders: Order[] = [];
        
        if (ordersSnapshot.exists()) {
          const ordersData = ordersSnapshot.val();
          userOrders = Object.entries(ordersData)
            .map(([id, data]: [string, any]) => ({ id, ...data }))
            .filter((order: Order) => order.buyerId === user.uid || order.sellerId === user.uid);
        }

        // Load deposit requests
        const depositsRef = ref(database, 'depositRequests');
        const depositsSnapshot = await get(depositsRef);
        let userDeposits: PaymentRequest[] = [];
        
        if (depositsSnapshot.exists()) {
          const depositsData = depositsSnapshot.val();
          userDeposits = Object.entries(depositsData)
            .map(([id, data]: [string, any]) => ({ id, ...data }))
            .filter((deposit: PaymentRequest) => deposit.userId === user.uid);
        }

        // Load withdraw requests
        const withdrawalsRef = ref(database, 'withdrawRequests');
        const withdrawalsSnapshot = await get(withdrawalsRef);
        let userWithdrawals: PaymentRequest[] = [];
        
        if (withdrawalsSnapshot.exists()) {
          const withdrawalsData = withdrawalsSnapshot.val();
          userWithdrawals = Object.entries(withdrawalsData)
            .map(([id, data]: [string, any]) => ({ id, ...data }))
            .filter((withdrawal: PaymentRequest) => withdrawal.userId === user.uid);
        }

        setOrders(userOrders);
        setDepositRequests(userDeposits);
        setWithdrawRequests(userWithdrawals);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isOpen, user.uid]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-4xl max-h-[90vh] mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Details - {user.username}</CardTitle>
          <Button variant="ghost" onClick={onClose}>
            <i className="fas fa-times"></i>
          </Button>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Username:</strong> {user.username}
                      </div>
                      <div>
                        <strong>Email:</strong> {user.email}
                      </div>
                      <div>
                        <strong>Wallet Balance:</strong> {formatCurrencySymbol(user.walletBalance || 0)}
                      </div>
                      <div>
                        <strong>Account Level:</strong> {user.accountLevel}
                      </div>
                      <div>
                        <strong>Status:</strong> {user.isDisabled ? 'Disabled' : 'Active'}
                      </div>
                      <div>
                        <strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Orders ({orders.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <p className="text-muted-foreground">No orders found.</p>
                    ) : (
                      <div className="space-y-2">
                        {orders.map((order) => (
                          <div key={order.id} className="p-3 border rounded">
                            <div className="flex justify-between items-start">
                              <div>
                                <strong>{order.accountTitle}</strong>
                                <p className="text-sm text-muted-foreground">
                                  {order.buyerId === user.uid ? 'Bought from' : 'Sold to'} {order.buyerId === user.uid ? 'Seller' : 'Buyer'}
                                </p>
                                <p className="text-sm">Price: {formatCurrencySymbol(order.price)}</p>
                                <p className="text-sm">Status: {order.status === 'delivered' ? 'Delivered' : order.status}</p>
                              </div>
                              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                                {order.status === 'delivered' ? 'Delivered' : order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Deposit Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Deposit Requests ({depositRequests.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {depositRequests.length === 0 ? (
                      <p className="text-muted-foreground">No deposit requests found.</p>
                    ) : (
                      <div className="space-y-2">
                        {depositRequests.map((request) => (
                          <div key={request.id} className="p-3 border rounded">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <strong>Amount: {formatCurrencySymbol(request.amount)}</strong>
                                  <Badge variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}>
                                    {request.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>Request Date: {new Date(request.createdAt).toLocaleDateString()}</p>
                                  {request.updatedAt && (
                                    <p>Updated: {new Date(request.updatedAt).toLocaleDateString()}</p>
                                  )}
                                  {request.country && (
                                    <p>Country: {request.country === 'egypt' ? 'Egypt' : 'Outside Egypt'}</p>
                                  )}
                                  {request.paymentMethod && (
                                    <p>Payment Method: {request.paymentMethod === 'instapay' ? 'Instapay' : request.paymentMethod === 'usdt' ? 'USDT' : request.paymentMethod}</p>
                                  )}
                                  {request.instapayUser && (
                                    <p>Instapay Username: {request.instapayUser}</p>
                                  )}
                                  {request.adminNotes && (
                                    <p className="text-orange-600">Admin Notes: {request.adminNotes}</p>
                                  )}
                                </div>
                                {request.receiptImage && (
                                  <div className="mt-2">
                                    <img
                                      src={request.receiptImage}
                                      alt="Receipt"
                                      className="w-20 h-20 object-cover rounded border cursor-pointer"
                                      onClick={() => window.open(request.receiptImage, '_blank')}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Withdraw Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Withdraw Requests ({withdrawRequests.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {withdrawRequests.length === 0 ? (
                      <p className="text-muted-foreground">No withdraw requests found.</p>
                    ) : (
                      <div className="space-y-2">
                        {withdrawRequests.map((request) => (
                          <div key={request.id} className="p-3 border rounded">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <strong>Amount: {formatCurrencySymbol(request.amount)}</strong>
                                  <Badge variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}>
                                    {request.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>Request Date: {new Date(request.createdAt).toLocaleDateString()}</p>
                                  {request.updatedAt && (
                                    <p>Updated: {new Date(request.updatedAt).toLocaleDateString()}</p>
                                  )}
                                  {request.country && (
                                    <p>Country: {request.country === 'egypt' ? 'Egypt' : 'Outside Egypt'}</p>
                                  )}
                                  {request.paymentMethod && (
                                    <p>Payment Method: {request.paymentMethod === 'instapay' ? 'Instapay' : request.paymentMethod === 'usdt' ? 'USDT' : request.paymentMethod}</p>
                                  )}
                                  {request.instapayUser && (
                                    <p>Instapay Username: {request.instapayUser}</p>
                                  )}
                                  {request.adminNotes && (
                                    <p className="text-orange-600">Admin Notes: {request.adminNotes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetailsModal;
