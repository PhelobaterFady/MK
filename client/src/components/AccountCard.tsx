import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GameAccount } from '@shared/schema';
import { formatCurrencySymbol } from '@/utils/currency';

interface AccountCardProps {
  account: GameAccount & {
    seller: {
      username: string;
      level: number;
      rating: number;
    };
  };
  onClick: (accountId: string) => void;
  onContactSeller?: (sellerId: string, accountId: string) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onClick, onContactSeller }) => {
  const getGameBadgeColor = (game: string) => {
    switch (game) {
      case 'fc26': return 'bg-green-500/20 text-green-400';
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
          className={`${i <= Math.floor(rating) ? 'fas fa-star' : 'far fa-star'} text-yellow-400 text-xs`}
        />
      );
    }
    return stars;
  };

  return (
    <Card 
      className="tournament-card card-hover cursor-pointer overflow-hidden glow hover:glow-cyan transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 w-full max-w-sm"
      onClick={() => onClick(account.id)}
      data-testid={`account-card-${account.id}`}
    >
      {account.images.length > 0 && (
        <div className="relative">
          <img 
            src={account.images[0]} 
            alt={account.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 right-3">
            <span className="text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1 rounded-lg backdrop-blur-sm shadow-lg" data-testid={`price-${account.id}`}>
              {formatCurrencySymbol(account.price)}
            </span>
          </div>
        </div>
      )}
      
      <CardContent className="p-6">
        {account.images.length === 0 && (
          <div className="text-center mb-4">
            <span className="text-xl font-bold text-blue-400" data-testid={`price-${account.id}`}>
              {formatCurrencySymbol(account.price)}
            </span>
          </div>
        )}
        
        <h3 className="font-semibold text-white mb-4 text-xl text-center" data-testid={`title-${account.id}`}>
          {account.title}
        </h3>
        
        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
          {account.gameSpecificData && Object.entries(account.gameSpecificData).slice(0, 4).map(([key, value]) => (
            <div key={key} className="flex justify-between bg-slate-700/30 rounded-lg px-3 py-2">
              <span className="text-slate-400 capitalize">{key}:</span>
              <span className="text-white font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center pt-4 border-t border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm text-white font-bold">
                  {account.seller.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white" data-testid={`seller-${account.id}`}>
                  {account.seller.username}
                </p>
                <div className="flex items-center space-x-1">
                  <div className="flex">
                    {renderStars(account.seller.rating)}
                  </div>
                  <span className="text-xs text-slate-400">
                    ({account.seller.rating.toFixed(1)})
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Views Count */}
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
            <i className="fas fa-eye"></i>
            <span>{account.views || 0} views</span>
          </div>
          
          <div className="flex justify-center">
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5"
              onClick={(e) => {
                e.stopPropagation();
                onClick(account.id);
              }}
            >
              <i className="fas fa-shopping-cart mr-2"></i>
              Buy Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountCard;
