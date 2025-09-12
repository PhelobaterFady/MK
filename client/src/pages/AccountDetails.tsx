import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ref, get, update } from 'firebase/database';
import { database } from '../lib/firebase';
import { GameAccount, User, Order } from '@shared/schema';

const AccountDetails: React.FC = () => {
  const [, params] = useRoute('/account/:id');
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<GameAccount | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!params?.id) return;

      try {
        // Fetch account details
        const accountRef = ref(database, `gameAccounts/${params.id}`);
        const accountSnapshot = await get(accountRef);

        if (accountSnapshot.exists()) {
          const accountData = accountSnapshot.val();
          const accountWithId: GameAccount = {
            id: params.id,
            ...accountData,
            createdAt: new Date(accountData.createdAt),
            updatedAt: new Date(accountData.updatedAt),
            featuredUntil: accountData.featuredUntil ? new Date(accountData.featuredUntil) : undefined
          };
          setAccount(accountWithId);

          // Fetch seller details
          const sellerRef = ref(database, `users/${accountData.sellerId}`);
          const sellerSnapshot = await get(sellerRef);
          
          if (sellerSnapshot.exists()) {
            const sellerData = sellerSnapshot.val();
            setSeller({
              id: accountData.sellerId,
              ...sellerData,
              joinDate: new Date(sellerData.joinDate),
              lastActive: sellerData.lastActive ? new Date(sellerData.lastActive) : undefined
            });
          }

          // Increment view count
          await update(ref(database, `gameAccounts/${params.id}`), {
            views: (accountData.views || 0) + 1
          });
        }
      } catch (error) {
        console.error('Error fetching account details:', error);
        toast({
          title: "Error",
          description: "Failed to load account details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [params?.id, toast]);

  const handlePurchase = async () => {
    if (!account || !seller || !userProfile || !currentUser) return;

    if (userProfile.walletBalance < account.price) {
      toast({
        title: "Insufficient Balance",
        description: "Please top up your wallet to complete this purchase.",
        variant: "destructive"
      });
      return;
    }

    if (account.sellerId === currentUser.uid) {
      toast({
        title: "Error",
        description: "You cannot purchase your own account.",
        variant: "destructive"
      });
      return;
    }

    setPurchasing(true);

    try {
      const orderId = `GV-${Date.now()}`;
      const orderData: Omit<Order, 'id'> = {
        buyerId: currentUser.uid,
        sellerId: account.sellerId,
        accountId: account.id,
        amount: account.price,
        status: 'escrow',
        escrowAmount: account.price,
        createdAt: new Date(),
        notes: `Purchase of ${account.title}`
      };

      // Create order
      await update(ref(database, `orders/${orderId}`), orderData);

      // Update account status
      await update(ref(database, `gameAccounts/${account.id}`), {
        status: 'pending'
      });

      // Deduct from buyer's wallet (funds go to escrow)
      await update(ref(database, `users/${currentUser.uid}`), {
        walletBalance: userProfile.walletBalance - account.price
      });

      // Create wallet transaction record
      const transactionId = `TXN-${Date.now()}`;
      await update(ref(database, `walletTransactions/${transactionId}`), {
        userId: currentUser.uid,
        type: 'purchase',
        amount: -account.price,
        description: `Purchase: ${account.title}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      });

      // Create escrow record
      await update(ref(database, `escrow/${orderId}`), {
        amount: account.price,
        buyerId: currentUser.uid,
        sellerId: account.sellerId,
        status: 'held',
        createdAt: new Date().toISOString()
      });

      toast({
        title: "Purchase Successful!",
        description: "Your order has been placed. The seller will be notified.",
      });

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!account || !seller) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Alert variant="destructive">
            <AlertDescription>
              Account not found or no longer available.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const getGameBadgeColor = (game: string) => {
    switch (game) {
      case 'fifa': return 'bg-green-500/20 text-green-400';
      case 'valorant': return 'bg-red-500/20 text-red-400';
      case 'lol': return 'bg-blue-500/20 text-blue-400';
      case 'pubg': return 'bg-yellow-500/20 text-yellow-400';
      case 'cod': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 4) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (level >= 3) return 'bg-gradient-to-r from-green-500 to-blue-500';
    if (level >= 2) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    return 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <i 
          key={i} 
          className={`${i <= Math.floor(rating) ? 'fas fa-star' : 'far fa-star'} text-yellow-400`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Account Images */}
          <div className="lg:col-span-2 space-y-4">
            {account.images.length > 0 ? (
              <div className="space-y-4">
                <img
                  src={account.images[0]}
                  alt={account.title}
                  className="w-full h-96 object-cover rounded-lg"
                  data-testid="account-main-image"
                />
                {account.images.length > 1 && (
                  <div className="grid grid-cols-3 gap-4">
                    {account.images.slice(1, 4).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${account.title} screenshot ${index + 2}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-image text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">No images available</p>
                </div>
              </div>
            )}

            {/* Account Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed" data-testid="account-description">
                  {account.description}
                </p>
              </CardContent>
            </Card>

            {/* Game-Specific Details */}
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6" data-testid="game-specific-details">
                  {Object.entries(account.gameSpecificData).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground capitalize font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-semibold">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Panel */}
          <div className="space-y-6">
            {/* Account Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className={`text-sm font-medium ${getGameBadgeColor(account.game)}`}>
                    {account.game.toUpperCase()}
                  </Badge>
                  {account.status === 'pending' && (
                    <Badge variant="secondary">Reserved</Badge>
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2" data-testid="account-title">
                  {account.title}
                </h1>

                <div className="flex items-baseline space-x-2 mb-6">
                  <span className="text-3xl font-bold text-primary" data-testid="account-price">
                    ${account.price}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
                  <i className="fas fa-eye"></i>
                  <span>{account.views} views</span>
                  <span>•</span>
                  <span>Listed {account.createdAt.toLocaleDateString()}</span>
                </div>

                {currentUser ? (
                  account.status === 'active' ? (
                    <Button
                      className="w-full gradient-primary text-lg py-3"
                      onClick={handlePurchase}
                      disabled={purchasing || account.sellerId === currentUser.uid}
                      data-testid="purchase-button"
                    >
                      {purchasing ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Processing...
                        </>
                      ) : account.sellerId === currentUser.uid ? (
                        <>
                          <i className="fas fa-user mr-2"></i>
                          Your Account
                        </>
                      ) : (
                        <>
                          <i className="fas fa-shopping-cart mr-2"></i>
                          Buy Now
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      disabled
                      variant="secondary"
                    >
                      <i className="fas fa-lock mr-2"></i>
                      No Longer Available
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full gradient-primary text-lg py-3"
                    onClick={() => window.location.href = '/login'}
                    data-testid="login-to-buy-button"
                  >
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Login to Purchase
                  </Button>
                )}

                {currentUser && userProfile && userProfile.walletBalance < account.price && (
                  <Alert className="mt-4" variant="destructive">
                    <AlertDescription>
                      Insufficient wallet balance. You need ${(account.price - userProfile.walletBalance).toFixed(2)} more.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-foreground">
                      {seller.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold" data-testid="seller-username">
                        {seller.username}
                      </h3>
                      <Badge className={`text-xs font-bold px-2 py-1 rounded text-white ${getLevelBadgeColor(seller.level)}`}>
                        LV {seller.level}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {renderStars(seller.rating)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({seller.rating.toFixed(1)})
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since:</span>
                    <span data-testid="seller-join-date">
                      {seller.joinDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total trades:</span>
                    <span data-testid="seller-total-trades">
                      {seller.totalTrades}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviews:</span>
                    <span data-testid="seller-review-count">
                      {seller.reviewCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response rate:</span>
                    <span className="text-green-400">98%</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {/* TODO: Open seller profile */}}
                  data-testid="view-seller-profile-button"
                >
                  <i className="fas fa-user mr-2"></i>
                  View Profile
                </Button>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card>
              <CardHeader>
                <CardTitle>Security & Safety</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center space-x-2 text-green-400">
                  <i className="fas fa-shield-check"></i>
                  <span>Secure escrow protection</span>
                </div>
                <div className="flex items-center space-x-2 text-green-400">
                  <i className="fas fa-undo"></i>
                  <span>7-day account guarantee</span>
                </div>
                <div className="flex items-center space-x-2 text-green-400">
                  <i className="fas fa-headset"></i>
                  <span>24/7 customer support</span>
                </div>
                <div className="flex items-center space-x-2 text-green-400">
                  <i className="fas fa-user-check"></i>
                  <span>Verified seller</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
