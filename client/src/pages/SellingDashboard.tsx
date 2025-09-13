import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrencySymbol } from '@/utils/currency';
import { getUserOrders, getUserGameAccounts, getUser, addAccountDetails } from '@/services/firebase-api';
import { ref, get } from 'firebase/database';
import { database } from '../lib/firebase';
import { Order, GameAccount } from '@shared/schema';
import AccountDetailsModal from '@/components/AccountDetailsModal';
import AddAccountDetailsModal from '@/components/AddAccountDetailsModal';
import AccountCredentialsModal from '@/components/AccountCredentialsModal';
import { useLocation } from 'wouter';

const SellingDashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('selling-orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [gameAccounts, setGameAccounts] = useState<GameAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{[key: string]: any}>({});
  
  // Modal states
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showAddAccountDetails, setShowAddAccountDetails] = useState(false);
  const [showAccountCredentials, setShowAccountCredentials] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // Load selling data
  useEffect(() => {
    const loadSellingData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const [userOrders, userGameAccounts] = await Promise.all([
          getUserOrders(currentUser.uid),
          getUserGameAccounts(currentUser.uid)
        ]);
        
        // Filter only selling orders (where user is the seller)
        const sellingOrders = userOrders.filter(order => order.sellerId === currentUser.uid);
        console.log('📊 Loaded selling orders:', sellingOrders.length);
        console.log('📊 Loaded game accounts:', userGameAccounts.length);
        console.log('📊 Sample order:', sellingOrders[0]);
        console.log('📊 Sample game account:', userGameAccounts[0]);
        
        // Check if orders have accountId
        sellingOrders.forEach((order, index) => {
          console.log(`📊 Order ${index}:`, {
            id: order.id,
            accountId: order.accountId,
            gameAccountTitle: order.gameAccountTitle,
            status: order.status
          });
        });
        
        // Check if game accounts have matching IDs
        userGameAccounts.forEach((account, index) => {
          console.log(`📊 Game Account ${index}:`, {
            id: account.id,
            title: account.title,
            game: account.game,
            status: account.status
          });
        });
        setOrders(sellingOrders);
        setGameAccounts(userGameAccounts);
        
        // Load user data for orders
        const userIds = new Set<string>();
        sellingOrders.forEach(order => {
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
        console.error('Error loading selling data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSellingData();
  }, [currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'escrow':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'delivering':
        return 'bg-blue-500/20 text-blue-400';
      case 'awaiting_confirmation':
        return 'bg-orange-500/20 text-orange-400';
      case 'delivered':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleShowAccountDetails = async (order: Order) => {
    console.log('🚀 FUNCTION CALLED: handleShowAccountDetails');
    console.log('🚀 Order received:', order);
    try {
      console.log('=== HANDLE SHOW ACCOUNT DETAILS ===');
      console.log('Order:', order);
      console.log('Order accountId:', order.accountId);
      console.log('Available gameAccounts:', gameAccounts.map(acc => ({ id: acc.id, title: acc.title })));
      console.log('Total gameAccounts count:', gameAccounts.length);
      console.log('Looking for account with ID:', order.accountId);
      console.log('Account found in local data:', gameAccounts.some(acc => acc.id === order.accountId));
      
      const account = gameAccounts.find(acc => acc.id === order.accountId);
      if (account) {
        console.log('✅ Found account in local data:', account);
        setSelectedAccount(account);
        setShowAccountDetails(true);
      } else {
        // If not found in gameAccounts, fetch from Firebase
        console.log('❌ Account not found in local data, fetching from Firebase:', order.accountId);
        console.log('Firebase path:', `gameAccounts/${order.accountId}`);
        
        const accountRef = ref(database, `gameAccounts/${order.accountId}`);
        const accountSnapshot = await get(accountRef);
        
        console.log('Firebase snapshot exists:', accountSnapshot.exists());
        console.log('Firebase snapshot data:', accountSnapshot.val());
        
        // Also check all accounts to see what's available
        const allAccountsRef = ref(database, 'gameAccounts');
        const allAccountsSnapshot = await get(allAccountsRef);
        if (allAccountsSnapshot.exists()) {
          const allAccounts = allAccountsSnapshot.val();
          console.log('All accounts in Firebase:', Object.keys(allAccounts));
          console.log('Looking for account ID:', order.accountId);
          console.log('Account exists in all accounts:', order.accountId in allAccounts);
          
          // Check if there's a similar account ID
          const similarIds = Object.keys(allAccounts).filter(id => 
            id.includes(order.accountId.substring(0, 10)) || 
            order.accountId.includes(id.substring(0, 10))
          );
          console.log('Similar account IDs found:', similarIds);
          
          // Show sample account data
          const sampleAccountId = Object.keys(allAccounts)[0];
          if (sampleAccountId) {
            console.log('Sample account data:', allAccounts[sampleAccountId]);
          }
        }
        
        if (accountSnapshot.exists()) {
          const accountData = accountSnapshot.val();
          console.log('✅ Account data fetched from Firebase:', accountData);
          
          const formattedAccount = {
            id: order.accountId,
            title: accountData.title || order.gameAccountTitle || 'Game Account',
            game: accountData.game || 'Unknown Game',
            description: accountData.description || 'Account details not available',
            price: accountData.price || order.price || 0,
            images: accountData.images || [],
            features: accountData.gameSpecificData ? Object.values(accountData.gameSpecificData) : [],
            sellerId: accountData.sellerId || order.sellerId,
            status: accountData.status || 'active',
            createdAt: accountData.createdAt || order.createdAt.toISOString()
          };
          
          console.log('✅ Formatted account for display:', formattedAccount);
          console.log('🔄 Setting selectedAccount to:', formattedAccount);
          setSelectedAccount(formattedAccount);
          setShowAccountDetails(true);
        } else {
          // If still not found, create a basic account object
          console.log('❌ Account not found in Firebase either, using fallback data');
          const fallbackAccount = {
            id: order.accountId,
            title: order.gameAccountTitle || 'Game Account',
            game: 'Unknown Game',
            description: 'Account details not available',
            price: order.price || 0,
            images: [],
            features: [],
            sellerId: order.sellerId,
            status: 'active',
            createdAt: order.createdAt.toISOString()
          };
          console.log('Fallback account:', fallbackAccount);
          console.log('🔄 Setting selectedAccount to fallback:', fallbackAccount);
          setSelectedAccount(fallbackAccount);
          setShowAccountDetails(true);
        }
      }
    } catch (error) {
      console.error('❌ Error loading account details:', error);
    }
  };

  const handleAddAccountDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowAddAccountDetails(true);
  };

  const handleShowAccountCredentials = (order: Order) => {
    setSelectedOrder(order);
    setShowAccountCredentials(true);
  };

  const handleAddAccountDetailsSubmit = async (accountDetails: any) => {
    if (!selectedOrder) return;
    
    try {
      await addAccountDetails(selectedOrder.id, accountDetails);
      
      // Refresh orders data
      if (currentUser) {
        const userOrders = await getUserOrders(currentUser.uid);
        const sellingOrders = userOrders.filter(order => order.sellerId === currentUser.uid);
        setOrders(sellingOrders);
      }
      
      setShowAddAccountDetails(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error adding account details:', error);
    }
  };

  const getTotalEarnings = () => {
    return orders
      .filter(order => order.status === 'delivered')
      .reduce((total, order) => total + (order.amount || order.price || 0), 0);
  };

  const getPendingEarnings = () => {
    return orders
      .filter(order => ['escrow', 'delivering', 'awaiting_confirmation'].includes(order.status))
      .reduce((total, order) => total + (order.amount || order.price || 0), 0);
  };

  const getActiveListings = () => {
    return gameAccounts.filter(account => account.status === 'active').length;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Selling Dashboard</h1>
            <p className="text-muted-foreground">Manage your sales, listings, and earnings</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to Main Dashboard</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-green-400 text-xl"></i>
                </div>
                <span className="text-2xl font-bold text-green-400">
                  {formatCurrencySymbol(getTotalEarnings())}
                </span>
              </div>
              <h3 className="font-semibold mb-1">Total Earnings</h3>
              <p className="text-sm text-muted-foreground">From completed sales</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-yellow-400 text-xl"></i>
                </div>
                <span className="text-2xl font-bold text-yellow-400">
                  {formatCurrencySymbol(getPendingEarnings())}
                </span>
              </div>
              <h3 className="font-semibold mb-1">Pending Earnings</h3>
              <p className="text-sm text-muted-foreground">In escrow orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-store text-blue-400 text-xl"></i>
                </div>
                <span className="text-2xl font-bold text-blue-400">
                  {getActiveListings()}
                </span>
              </div>
              <h3 className="font-semibold mb-1">Active Listings</h3>
              <p className="text-sm text-muted-foreground">Available for sale</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-purple-400 text-xl"></i>
                </div>
                <span className="text-2xl font-bold text-purple-400">
                  {orders.length}
                </span>
              </div>
              <h3 className="font-semibold mb-1">Total Sales</h3>
              <p className="text-sm text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Selling Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="selling-orders">
                  Selling Orders
                </TabsTrigger>
                <TabsTrigger value="my-listings">
                  My Listings
                </TabsTrigger>
                <TabsTrigger value="selling-history">
                  Selling History
                </TabsTrigger>
                <TabsTrigger value="sales-analytics">
                  Sales Analytics
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="selling-orders" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading selling orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-store text-4xl mb-4"></i>
                    <p>No selling orders found</p>
                    <p className="text-sm">Your selling orders will appear here when someone buys your accounts</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <Card key={order.id} className="border border-border">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-2">
                              {order.gameAccountTitle || 'Game Account Order'}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-muted-foreground">Order ID:</span>
                              <span className="font-mono">#{order.id}</span>
                              <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                                {order.status === 'escrow' ? 'Awaiting Account Details' : 
                                 order.status === 'delivering' ? 'Delivering' :
                                 order.status === 'awaiting_confirmation' ? 'Awaiting Confirmation' :
                                 order.status === 'delivered' ? 'Delivered' : order.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-green-400">
                              +{formatCurrencySymbol(order.amount || order.price || 0)}
                              {/* Debug: {JSON.stringify({price: order.price, id: order.id})} */}
                            </span>
                            <p className="text-sm text-muted-foreground">{order.createdAt.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white">S</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">You (Seller)</p>
                              <p className="text-xs text-muted-foreground">Sale</p>
                              <div className="text-xs text-muted-foreground mt-1">
                                <p><strong>Buyer:</strong> {userData[order.buyerId]?.displayName || 'Unknown'}</p>
                                <p><strong>Account:</strong> {order.gameAccountTitle || 'Game Account'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              <i className="fas fa-comment mr-1"></i>
                              Chat
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowAccountDetails(order)}
                            >
                              <i className="fas fa-eye mr-1"></i>
                              View Details
                            </Button>
                            {order.accountDetails && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleShowAccountCredentials(order)}
                              >
                                <i className="fas fa-key mr-1"></i>
                                Show Credentials
                              </Button>
                            )}
                            {(order.status === 'escrow' || order.status === 'delivering') && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleAddAccountDetails(order)}
                              >
                                <i className="fas fa-plus mr-1"></i>
                                Add Account Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="my-listings">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading listings...</span>
                  </div>
                ) : gameAccounts.filter(account => account.status === 'active').length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-box-open text-muted-foreground text-4xl mb-4"></i>
                    <h3 className="text-lg font-semibold mb-2">No active listings</h3>
                    <p className="text-muted-foreground mb-4">Start selling your gaming accounts today!</p>
                    <Button onClick={() => navigate('/sell')}>
                      <i className="fas fa-plus mr-2"></i>
                      Create Listing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gameAccounts.filter(account => account.status === 'active').map((account) => (
                      <Card key={account.id} className="border border-border">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg mb-2">{account.title}</h3>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-muted-foreground">Game:</span>
                                <span>{account.game}</span>
                                <Badge className={`text-xs ${account.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                  {account.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold text-primary">
                                {formatCurrencySymbol(account.price)}
                              </span>
                              <p className="text-sm text-muted-foreground">{account.createdAt.toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-xs text-primary-foreground">L</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Your Listing</p>
                                <p className="text-xs text-muted-foreground">Available for purchase</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  console.log('Edit button clicked for account:', account.id);
                                  window.location.href = `/sell?edit=${account.id}`;
                                }}
                              >
                                <i className="fas fa-edit mr-1"></i>
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/account/${account.id}`)}
                              >
                                <i className="fas fa-eye mr-1"></i>
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="selling-history">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading selling history...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-history text-4xl mb-4"></i>
                    <p>No selling history</p>
                    <p className="text-sm">Your selling history will appear here</p>
                  </div>
                ) : (
                  orders.map((order) => (
                  <Card key={order.id} className="border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">
                            {order.gameAccountTitle || 'Game Account Order'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono">#{order.id}</span>
                            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                              {order.status === 'escrow' ? 'Awaiting Account Details' : 
                               order.status === 'delivering' ? 'Delivering' :
                               order.status === 'awaiting_confirmation' ? 'Awaiting Confirmation' : 
                               order.status === 'delivered' ? 'Delivered' : order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-green-400">
                            +{formatCurrencySymbol(order.amount || order.price || 0)}
                          </span>
                          <p className="text-sm text-muted-foreground">{order.createdAt.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">S</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">You (Seller)</p>
                            <p className="text-xs text-muted-foreground">Sale</p>
                            <div className="text-xs text-muted-foreground mt-1">
                              <p><strong>Buyer:</strong> {userData[order.buyerId]?.displayName || 'Unknown'}</p>
                              <p><strong>Seller:</strong> {userData[order.sellerId]?.displayName || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <i className="fas fa-comment mr-1"></i>
                            Chat
                          </Button>
                          {order.status === 'delivered' && (
                            <Button variant="outline" size="sm">
                              <i className="fas fa-eye mr-1"></i>
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="sales-analytics">
                <div className="text-center py-8 text-muted-foreground">
                  <i className="fas fa-chart-bar text-4xl mb-4"></i>
                  <h3 className="text-lg font-semibold mb-2">Sales Analytics</h3>
                  <p className="text-sm">Detailed analytics and insights coming soon!</p>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Modals */}
      <AccountDetailsModal
        isOpen={showAccountDetails}
        onClose={() => setShowAccountDetails(false)}
        accountData={selectedAccount}
      />

      <AddAccountDetailsModal
        isOpen={showAddAccountDetails}
        onClose={() => setShowAddAccountDetails(false)}
        onSubmit={handleAddAccountDetailsSubmit}
        orderData={selectedOrder ? {
          id: selectedOrder.id,
          gameAccountTitle: selectedOrder.gameAccountTitle || 'Game Account',
          price: selectedOrder.price || 0,
          buyerName: userData[selectedOrder.buyerId]?.displayName || 'Unknown'
        } : null}
      />

      <AccountCredentialsModal
        isOpen={showAccountCredentials}
        onClose={() => setShowAccountCredentials(false)}
        orderData={selectedOrder ? {
          id: selectedOrder.id,
          gameAccountTitle: selectedOrder.gameAccountTitle || 'Game Account',
          price: selectedOrder.price || 0,
          status: selectedOrder.status,
          accountDetails: selectedOrder.accountDetails
        } : null}
      />
    </div>
  );
};

export default SellingDashboard;
