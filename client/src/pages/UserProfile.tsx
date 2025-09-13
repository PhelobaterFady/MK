import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrencySymbol } from '@/utils/currency';
import { GameAccount, User, Order } from '@shared/schema';

const UserProfile: React.FC = () => {
  const [, params] = useRoute('/profile/:userId');
  const { currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userAccounts, setUserAccounts] = useState<GameAccount[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    successfulSales: 0,
    successfulPurchases: 0,
    totalEarnings: 0,
    totalSpent: 0
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!params?.userId) return;

      try {
        // Fetch user details
        const userRef = ref(database, `users/${params.userId}`);
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          setUser({
            id: params.userId,
            ...userData,
            joinDate: new Date(userData.joinDate)
          });

          // Fetch user's accounts - Alternative approach
          console.log('=== FETCHING ACCOUNTS ===');
          console.log('Looking for sellerId:', params.userId);
          
          // Try to get all accounts first
          const accountsRef = ref(database, 'gameAccounts');
          const accountsSnapshot = await get(accountsRef);
          
          console.log('All accounts snapshot exists:', accountsSnapshot.exists());
          
          if (accountsSnapshot.exists()) {
            const allAccountsData = accountsSnapshot.val();
            console.log('All accounts data keys:', Object.keys(allAccountsData));
            console.log('All accounts data sample:', Object.values(allAccountsData).slice(0, 2));
            
            // Filter accounts for this user
            const userAccountsData = Object.entries(allAccountsData).filter(([id, data]: [string, any]) => {
              const matches = data.sellerId === params.userId;
              if (matches) {
                console.log(`✅ MATCHING ACCOUNT ${id}:`, {
                  sellerId: data.sellerId,
                  title: data.title,
                  status: data.status,
                  price: data.price
                });
              }
              return matches;
            });
            
            console.log('=== ACCOUNTS FILTERED ===');
            console.log('User accounts found:', userAccountsData.length);
            
            const accountsList: GameAccount[] = userAccountsData.map(([id, data]: [string, any]) => ({
              id,
              ...data,
              createdAt: new Date(data.createdAt),
              updatedAt: new Date(data.updatedAt),
              featuredUntil: data.featuredUntil ? new Date(data.featuredUntil) : undefined
            }));
            
            console.log('Final accounts list:', accountsList);
            setUserAccounts(accountsList);
          } else {
            console.log('No accounts found in database');
          }

          // Fetch user's orders (as buyer and seller) - Alternative approach
          console.log('=== FETCHING ORDERS ===');
          console.log('Looking for userId:', params.userId);
          
          // Try to get all orders first
          const ordersRef = ref(database, 'orders');
          const ordersSnapshot = await get(ordersRef);
          
          console.log('Orders snapshot exists:', ordersSnapshot.exists());
          
          if (ordersSnapshot.exists()) {
            const ordersData = ordersSnapshot.val();
            console.log('Raw orders data keys:', Object.keys(ordersData));
            console.log('Raw orders data sample:', Object.values(ordersData).slice(0, 2));
            
            const ordersList: Order[] = Object.entries(ordersData).map(([id, data]: [string, any]) => ({
              id,
              ...data,
              createdAt: new Date(data.createdAt),
              updatedAt: new Date(data.updatedAt)
            }));

            console.log('All orders list length:', ordersList.length);
            console.log('Sample orders:', ordersList.slice(0, 3));

            // Filter orders for this user with more detailed logging
            const userOrdersList = ordersList.filter(order => {
              const isBuyer = order.buyerId === params.userId;
              const isSeller = order.sellerId === params.userId;
              const matches = isBuyer || isSeller;
              
              if (matches) {
                console.log(`✅ MATCHING ORDER ${order.id}:`, {
                  buyerId: order.buyerId,
                  sellerId: order.sellerId,
                  status: order.status,
                  amount: order.amount,
                  isBuyer,
                  isSeller
                });
              }
              
              return matches;
            });
            
            console.log('=== FILTERED RESULTS ===');
            console.log('Total orders found:', userOrdersList.length);
            console.log('Filtered user orders:', userOrdersList);
            setUserOrders(userOrdersList);

            // Calculate stats
            const salesOrders = userOrdersList.filter(order => order.sellerId === params.userId);
            const purchaseOrders = userOrdersList.filter(order => order.buyerId === params.userId);
            
            console.log('User Orders Debug:', {
              userId: params.userId,
              totalOrders: userOrdersList.length,
              salesOrders: salesOrders.length,
              purchaseOrders: purchaseOrders.length,
              salesOrdersData: salesOrders,
              purchaseOrdersData: purchaseOrders
            });
            
            const successfulSales = salesOrders.filter(order => order.status === 'delivered');
            const successfulPurchases = purchaseOrders.filter(order => order.status === 'delivered');

            const totalEarnings = successfulSales.reduce((sum, order) => sum + (order.amount || order.price || 0), 0);
            const totalSpent = successfulPurchases.reduce((sum, order) => sum + (order.amount || order.price || 0), 0);

            console.log('Stats calculated:', {
              totalSales: salesOrders.length,
              totalPurchases: purchaseOrders.length,
              successfulSales: successfulSales.length,
              successfulPurchases: successfulPurchases.length,
              totalEarnings,
              totalSpent
            });

            setStats({
              totalSales: salesOrders.length,
              totalPurchases: purchaseOrders.length,
              successfulSales: successfulSales.length,
              successfulPurchases: successfulPurchases.length,
              totalEarnings,
              totalSpent
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [params?.userId]);

  const getLevelInfo = (level: number) => {
    if (level <= 10) return { rank: 'Iron', color: 'bg-gray-500' };
    if (level <= 30) return { rank: 'Bronze', color: 'bg-orange-600' };
    if (level <= 60) return { rank: 'Gold', color: 'bg-yellow-500' };
    if (level <= 99) return { rank: 'Platinum', color: 'bg-blue-500' };
    if (level <= 150) return { rank: 'Diamond', color: 'bg-purple-500' };
    if (level <= 200) return { rank: 'Emerald', color: 'bg-green-500' };
    return { rank: 'Ruby', color: 'bg-red-500' };
  };

  const handleBackToMarketplace = () => {
    window.location.href = '/marketplace';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-white mb-4">User not found</h1>
          <Button onClick={handleBackToMarketplace}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(user.level || 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackToMarketplace}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Marketplace
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {user.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{user.username}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`${levelInfo.color} text-white`}>
                    {levelInfo.rank} {user.level || 1}
                  </Badge>
                  <span className="text-slate-400 text-sm">
                    Member since {user.joinDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="lg:col-span-1 space-y-4">
            {/* Sales Stats */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <i className="fas fa-chart-line text-green-400 mr-2"></i>
                  Sales Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {console.log('Rendering sales stats:', stats)}
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Sales:</span>
                  <span className="text-white font-semibold">{stats.totalSales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Successful:</span>
                  <span className="text-green-400 font-semibold">{stats.successfulSales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Success Rate:</span>
                  <span className="text-green-400 font-semibold">
                    {stats.totalSales > 0 ? Math.round((stats.successfulSales / stats.totalSales) * 100) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Stats */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <i className="fas fa-shopping-cart text-blue-400 mr-2"></i>
                  Purchase Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Purchases:</span>
                  <span className="text-white font-semibold">{stats.totalPurchases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Successful:</span>
                  <span className="text-green-400 font-semibold">{stats.successfulPurchases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Success Rate:</span>
                  <span className="text-green-400 font-semibold">
                    {stats.totalPurchases > 0 ? Math.round((stats.successfulPurchases / stats.totalPurchases) * 100) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* User Info */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <i className="fas fa-user text-purple-400 mr-2"></i>
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Username:</span>
                  <span className="text-white font-semibold">{user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Level:</span>
                  <Badge className={`${levelInfo.color} text-white`}>
                    {levelInfo.rank} {user.level || 1}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Join Date:</span>
                  <span className="text-white font-semibold">
                    {user.joinDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Review Count:</span>
                  <span className="text-white font-semibold">{user.reviewCount || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User's Products */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <i className="fas fa-gamepad text-orange-400 mr-2"></i>
                  Products ({userAccounts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {console.log('Rendering products section, userAccounts.length:', userAccounts.length)}
                {userAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-gamepad text-4xl text-slate-500 mb-4"></i>
                    <p className="text-slate-400">No products listed yet</p>
                    <p className="text-slate-500 text-sm mt-2">Debug: userAccounts array length is {userAccounts.length}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userAccounts.map((account) => (
                        <Card 
                          key={account.id} 
                          className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/70 transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/account/${account.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-16 h-16 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                {account.images && account.images.length > 0 ? (
                                  <img
                                    src={account.images[0]}
                                    alt={account.title}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <i className="fas fa-gamepad text-2xl text-slate-400"></i>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white text-sm mb-1 truncate">
                                  {account.title}
                                </h3>
                                <p className="text-slate-400 text-xs mb-2">
                                  {account.description?.substring(0, 60)}...
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="text-green-400 font-semibold">
                                    {formatCurrencySymbol(account.price)}
                                  </div>
                                  <Badge className="bg-blue-600 text-white text-xs">
                                    {account.game.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs text-slate-500">
                                    Listed {account.createdAt.toLocaleDateString()}
                                  </span>
                                  <i className="fas fa-external-link-alt text-xs text-slate-400"></i>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
