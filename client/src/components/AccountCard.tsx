import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GameAccount } from '@shared/schema';

interface AccountCardProps {
  account: GameAccount & {
    seller: {
      username: string;
      level: number;
      rating: number;
    };
  };
  onClick: (accountId: string) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onClick }) => {
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
          className={`${i <= Math.floor(rating) ? 'fas fa-star' : 'far fa-star'} text-yellow-400 text-xs`}
        />
      );
    }
    return stars;
  };

  return (
    <Card 
      className="tournament-card card-hover cursor-pointer overflow-hidden glow hover:glow-cyan transition-all duration-300 transform hover:-translate-y-2"
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
          <div className="absolute top-3 left-3">
            <Badge className={`text-xs font-medium ${getGameBadgeColor(account.game)} backdrop-blur-sm`}>
              {account.game.toUpperCase()}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <span className="text-lg font-bold text-white bg-gradient-primary px-3 py-1 rounded-lg backdrop-blur-sm shadow-lg" data-testid={`price-${account.id}`}>
              ${account.price}
            </span>
          </div>
        </div>
      )}
      
      <CardContent className="p-6 bg-gradient-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge 
              className={`text-xs font-bold px-2 py-1 rounded text-white ${getLevelBadgeColor(account.seller.level)} glow-purple`}
              data-testid={`seller-level-${account.id}`}
            >
              LV {account.seller.level}
            </Badge>
          </div>
          {account.images.length === 0 && (
            <span className="text-lg font-bold text-primary" data-testid={`price-${account.id}`}>
              ${account.price}
            </span>
          )}
        </div>
        
        <h3 className="font-semibold mb-2 line-clamp-2" data-testid={`title-${account.id}`}>
          {account.title}
        </h3>
        
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          {Object.entries(account.gameSpecificData).slice(0, 4).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-muted-foreground capitalize">{key}:</span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs text-primary-foreground">
                {account.seller.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium" data-testid={`seller-${account.id}`}>
                {account.seller.username}
              </p>
              <div className="flex items-center space-x-1">
                <div className="flex">
                  {renderStars(account.seller.rating)}
                </div>
                <span className="text-xs text-muted-foreground">
                  ({account.seller.rating.toFixed(1)})
                </span>
              </div>
            </div>
          </div>
          <Badge className={`text-xs font-bold px-2 py-1 rounded text-white ${getLevelBadgeColor(account.seller.level)}`}>
            LV {account.seller.level}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountCard;
