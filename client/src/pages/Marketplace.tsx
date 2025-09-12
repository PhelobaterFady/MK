import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import AccountCard from '../components/AccountCard';
import { GameAccount } from '@shared/schema';

// Mock data - in real app this would come from Firebase
const MOCK_ACCOUNTS: (GameAccount & { seller: { username: string; level: number; rating: number; } })[] = [
  {
    id: '1',
    sellerId: 'seller1',
    game: 'fifa',
    title: 'Premium FIFA 24 Account - 95 OVR Team',
    description: 'High-end FIFA Ultimate Team account with incredible players...',
    price: 299,
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250'],
    gameSpecificData: {
      level: 87,
      coins: '2.5M',
      rating: '95 OVR',
      region: 'NA'
    },
    status: 'active',
    views: 145,
    createdAt: new Date(),
    updatedAt: new Date(),
    seller: {
      username: 'mike_trader',
      level: 4,
      rating: 4.9
    }
  },
  {
    id: '2',
    sellerId: 'seller2',
    game: 'valorant',
    title: 'Immortal Valorant Account - All Agents',
    description: 'High-rank Valorant account with all agents unlocked...',
    price: 450,
    images: ['https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250'],
    gameSpecificData: {
      rank: 'Immortal 2',
      rr: 2847,
      agents: '22/22',
      skins: 47
    },
    status: 'active',
    views: 89,
    createdAt: new Date(),
    updatedAt: new Date(),
    seller: {
      username: 'alex_pro',
      level: 3,
      rating: 5.0
    }
  }
];

const Marketplace: React.FC = () => {
  const [location] = useLocation();
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);
  const [filteredAccounts, setFilteredAccounts] = useState(MOCK_ACCOUNTS);
  const [filters, setFilters] = useState({
    game: '',
    priceMin: '',
    priceMax: '',
    minRating: 1,
    sortBy: 'newest'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const accountsPerPage = 9;

  // Get game filter from URL
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const gameParam = params.get('game');
    if (gameParam) {
      setFilters(prev => ({ ...prev, game: gameParam }));
    }
  }, [location]);

  // Apply filters
  useEffect(() => {
    let filtered = [...accounts];

    // Game filter
    if (filters.game) {
      filtered = filtered.filter(account => account.game === filters.game);
    }

    // Price range filter
    if (filters.priceMin) {
      filtered = filtered.filter(account => account.price >= parseFloat(filters.priceMin));
    }
    if (filters.priceMax) {
      filtered = filtered.filter(account => account.price <= parseFloat(filters.priceMax));
    }

    // Rating filter
    filtered = filtered.filter(account => account.seller.rating >= filters.minRating);

    // Sort
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.seller.rating - a.seller.rating);
        break;
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    setFilteredAccounts(filtered);
    setCurrentPage(1);
  }, [accounts, filters]);

  const handleAccountClick = (accountId: string) => {
    window.location.href = `/account/${accountId}`;
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / accountsPerPage);
  const startIndex = (currentPage - 1) * accountsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + accountsPerPage);

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Game Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Game</Label>
                  <Select value={filters.game} onValueChange={(value) => handleFilterChange('game', value)}>
                    <SelectTrigger data-testid="game-filter">
                      <SelectValue placeholder="All Games" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Games</SelectItem>
                      <SelectItem value="fifa">FIFA 24</SelectItem>
                      <SelectItem value="valorant">Valorant</SelectItem>
                      <SelectItem value="lol">League of Legends</SelectItem>
                      <SelectItem value="pubg">PUBG</SelectItem>
                      <SelectItem value="cod">Call of Duty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Price Range</Label>
                  <div className="flex items-center space-x-2 mb-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin}
                      onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                      className="flex-1"
                      data-testid="price-min-input"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax}
                      onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                      className="flex-1"
                      data-testid="price-max-input"
                    />
                  </div>
                </div>

                {/* Seller Rating */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Minimum Seller Rating</Label>
                  <div className="flex space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`${
                          star <= filters.minRating ? 'fas fa-star text-yellow-400' : 'far fa-star text-muted-foreground'
                        } cursor-pointer`}
                        onClick={() => handleFilterChange('minRating', star)}
                      />
                    ))}
                  </div>
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={(value) => handleFilterChange('minRating', value[0])}
                    min={1}
                    max={5}
                    step={0.5}
                    className="w-full"
                    data-testid="rating-slider"
                  />
                </div>

                {/* Sort By */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Sort By</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                    <SelectTrigger data-testid="sort-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Marketplace Results */}
          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Available Accounts</h2>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span data-testid="results-count">{filteredAccounts.length}</span>
                <span>results found</span>
              </div>
            </div>

            {/* Account Listings Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8" data-testid="accounts-grid">
              {paginatedAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onClick={handleAccountClick}
                />
              ))}
            </div>

            {filteredAccounts.length === 0 && (
              <div className="text-center py-12">
                <i className="fas fa-search text-muted-foreground text-4xl mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">No accounts found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  data-testid="prev-page-button"
                >
                  <i className="fas fa-chevron-left mr-1"></i>
                  Previous
                </Button>
                
                <div className="flex space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "secondary"}
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10 h-10"
                        data-testid={`page-${pageNum}-button`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="next-page-button"
                >
                  Next
                  <i className="fas fa-chevron-right ml-1"></i>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
