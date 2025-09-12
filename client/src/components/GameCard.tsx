import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface GameCardProps {
  game: {
    id: string;
    name: string;
    image: string;
    accountCount: number;
  };
  onClick: (gameId: string) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  return (
    <Card 
      className="game-card card-hover cursor-pointer" 
      onClick={() => onClick(game.id)}
      data-testid={`game-card-${game.id}`}
    >
      <CardContent className="p-6 text-center">
        <img 
          src={game.image} 
          alt={`${game.name} Game`} 
          className="w-full h-32 object-cover rounded-lg mb-4"
        />
        <h3 className="font-bold text-lg mb-2">{game.name}</h3>
        <p className="text-sm text-muted-foreground" data-testid={`account-count-${game.id}`}>
          {game.accountCount.toLocaleString()} accounts
        </p>
      </CardContent>
    </Card>
  );
};

export default GameCard;
