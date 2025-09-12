import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import GameCard from '../components/GameCard';

const GAMES = [
  {
    id: 'fifa',
    name: 'FIFA 24',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    accountCount: 1247
  },
  {
    id: 'valorant',
    name: 'Valorant',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    accountCount: 892
  },
  {
    id: 'lol',
    name: 'League of Legends',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    accountCount: 2134
  },
  {
    id: 'pubg',
    name: 'PUBG',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    accountCount: 567
  },
  {
    id: 'cod',
    name: 'Call of Duty',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    accountCount: 743
  }
];

const Home: React.FC = () => {
  const handleGameClick = (gameId: string) => {
    window.location.href = `/marketplace?game=${gameId}`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/10"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Trade Game Accounts <br/>
              <span className="gradient-primary bg-clip-text text-transparent">Safely & Securely</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Buy and sell premium gaming accounts with our secure escrow system. Level up your gaming experience today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/marketplace">
                <Button className="gradient-primary text-primary-foreground px-8 py-3 hover:scale-105 transition-transform glow" data-testid="browse-marketplace-button">
                  <i className="fas fa-store mr-2"></i>
                  Browse Marketplace
                </Button>
              </Link>
              <Link href="/sell">
                <Button variant="secondary" className="px-8 py-3" data-testid="sell-account-button">
                  <i className="fas fa-plus mr-2"></i>
                  Sell Account
                </Button>
              </Link>
            </div>
          </div>

          {/* Game Selection Grid */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Popular Games</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {GAMES.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={handleGameClick}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
