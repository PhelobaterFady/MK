import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';

// Mock data
const MOCK_ORDERS = [
  {
    id: 'GV-2024-001847',
    title: 'FIFA 24 Account Purchase',
    amount: 299.00,
    status: 'escrow',
    date: '2024-12-15',
    type: 'purchase',
    seller: { username: 'mike_trader' }
  },
  {
    id: 'GV-2024-001823',
    title: 'Valorant Account Sale',
    amount: 427.50,
    status: 'delivered',
    date: '2024-12-12',
    type: 'sale',
    buyer: { username: 'kelly_player' }
  }
];

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('active-orders');

  if (!userProfile) {
    return <div>Loading...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'escrow': return 'bg-yellow-500/20 text-yellow-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-blue-500/20 text-blue-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getLevelProgress = () => {
    const nextLevelRequirement = userProfile.level * 500;
    const progress = (userProfile.totalTrades / nextLevelRequirement) * 100;
    return Math.min(progress, 100);
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Manage your account, orders, and wallet</p>
        </div>

        {/* User Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card data-testid="wallet-balance-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-wallet text-primary text-xl"></i>
                </div>
                <span className="text-2xl font-bold" data-testid="wallet-balance">
                  ${userProfile.walletBalance.toFixed(2)}
                </span>
              </div>
              <h3 className="font-semibold mb-1">Wallet Balance</h3>
              <p className="text-sm text-muted-foreground">Available for purchases</p>
            </CardContent>
          </Card>

          <Card data-testid="total-trades-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-green-400 text-xl"></i>
                </div>
                <span className="text-2xl font-bold" data-testid="total-trades">
                  {userProfile.totalTrades}
                </span>
              </div>
              <h3 className="font-semibold mb-1">Total Trades</h3>
              <p className="text-sm text-muted-foreground">Completed transactions</p>
            </CardContent>
          </Card>

          <Card data-testid="rating-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-star text-purple-400 text-xl"></i>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-2xl font-bold" data-testid="user-rating">
                    {userProfile.rating.toFixed(1)}
                  </span>
                  <i className="fas fa-star text-yellow-400"></i>
                </div>
              </div>
              <h3 className="font-semibold mb-1">Rating</h3>
              <p className="text-sm text-muted-foreground">
                From {userProfile.reviewCount} reviews
              </p>
            </CardContent>
          </Card>

          <Card data-testid="level-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="level-badge w-12 h-12 rounded-lg flex items-center justify-center">
                  <i className="fas fa-trophy text-white text-xl"></i>
                </div>
                <span className="text-2xl font-bold" data-testid="user-level">
                  Level {userProfile.level}
                </span>
              </div>
              <h3 className="font-semibold mb-1">Account Level</h3>
              <p className="text-sm text-muted-foreground">
                {(userProfile.level * 500) - userProfile.totalTrades} trades to Level {userProfile.level + 1}
              </p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getLevelProgress()}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="active-orders" data-testid="active-orders-tab">
                  Active Orders
                </TabsTrigger>
                <TabsTrigger value="my-listings" data-testid="my-listings-tab">
                  My Listings
                </TabsTrigger>
                <TabsTrigger value="order-history" data-testid="order-history-tab">
                  Order History
                </TabsTrigger>
                <TabsTrigger value="profile-settings" data-testid="profile-settings-tab">
                  Profile Settings
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="active-orders" className="space-y-4">
                {MOCK_ORDERS.map((order) => (
                  <Card key={order.id} className="border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2" data-testid={`order-title-${order.id}`}>
                            {order.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono" data-testid={`order-id-${order.id}`}>
                              #{order.id}
                            </span>
                            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                              {order.status === 'escrow' ? 'In Escrow' : order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <span 
                            className={`text-xl font-bold ${order.type === 'sale' ? 'text-green-400' : 'text-primary'}`}
                            data-testid={`order-amount-${order.id}`}
                          >
                            {order.type === 'sale' ? '+' : ''}${order.amount.toFixed(2)}
                          </span>
                          <p className="text-sm text-muted-foreground">{order.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-foreground">
                              {(order.seller?.username || order.buyer?.username)?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {order.seller?.username || order.buyer?.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.type === 'purchase' ? 'Seller' : 'Buyer'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`chat-button-${order.id}`}
                          >
                            <i className="fas fa-comment mr-1"></i>
                            Chat
                          </Button>
                          {order.status === 'escrow' && order.type === 'purchase' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`confirm-delivery-${order.id}`}
                            >
                              <i className="fas fa-check mr-1"></i>
                              Confirm Delivery
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="my-listings">
                <div className="text-center py-8">
                  <i className="fas fa-box-open text-muted-foreground text-4xl mb-4"></i>
                  <h3 className="text-lg font-semibold mb-2">No active listings</h3>
                  <p className="text-muted-foreground mb-4">Start selling your gaming accounts today!</p>
                  <Button data-testid="create-listing-button">
                    <i className="fas fa-plus mr-2"></i>
                    Create Listing
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="order-history">
                <div className="text-center py-8">
                  <i className="fas fa-history text-muted-foreground text-4xl mb-4"></i>
                  <h3 className="text-lg font-semibold mb-2">Order history will appear here</h3>
                  <p className="text-muted-foreground">Your completed transactions will be shown here.</p>
                </div>
              </TabsContent>

              <TabsContent value="profile-settings">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Username</label>
                        <p className="text-muted-foreground" data-testid="profile-username">
                          {userProfile.username}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-muted-foreground" data-testid="profile-email">
                          {userProfile.email}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Join Date</label>
                        <p className="text-muted-foreground" data-testid="profile-join-date">
                          {userProfile.joinDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Account Status</label>
                        <Badge variant={userProfile.isVerified ? 'default' : 'secondary'}>
                          {userProfile.isVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
