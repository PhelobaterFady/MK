import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import AccountCard from '../components/AccountCard';
import { GameAccount, User } from '@shared/schema';
import { getGameAccounts, getGameAccountsByGame, getUser } from '../services/firebase-api';
import { useAuth } from '../hooks/useAuth';
import { database } from '../lib/firebase';
import { ref, get, update } from 'firebase/database';

// Type for account with seller info
type AccountWithSeller = GameAccount & { 
  seller: { 
    username: string; 
    level: number; 
    rating: number; 
  } 
};

const Marketplace: React.FC = () => {
  const [location] = useLocation();
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<AccountWithSeller[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<AccountWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    game: 'all',
    priceMin: '',
    priceMax: '',
    sortBy: 'newest'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const accountsPerPage = 9;
  const [refreshKey, setRefreshKey] = useState(0);

  // Load accounts from Firebase
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        console.log('Loading accounts from Firebase...');
        const gameAccounts = await getGameAccounts();
        console.log('Retrieved accounts:', gameAccounts.length);
        
        // Filter only active accounts
        const activeAccounts = gameAccounts.filter(account => account.status === 'active');
        console.log('Active accounts:', activeAccounts.length);
        
        // Get seller info for each account
        const accountsWithSellers = await Promise.all(
          activeAccounts.map(async (account) => {
            try {
              const seller = await getUser(account.sellerId);
              return {
                ...account,
                seller: {
                  username: seller?.username || 'Unknown',
                  level: seller?.level || 1,
                  rating: seller?.rating || 0
                }
              };
            } catch (error) {
              console.error('Error loading seller for account:', account.id, error);
              return {
                ...account,
                seller: {
                  username: 'Unknown',
                  level: 1,
                  rating: 0
                }
              };
            }
          })
        );
        
        console.log('Final accounts with sellers:', accountsWithSellers.length);
        setAccounts(accountsWithSellers);
        setFilteredAccounts(accountsWithSellers);
      } catch (error) {
        console.error('Error loading accounts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAccounts();
  }, [refreshKey]);

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    setRefreshKey(prev => prev + 1);
  };

  const resetFilters = () => {
    console.log('Resetting filters to default');
    setFilters({
      game: 'all',
      priceMin: '',
      priceMax: '',
      sortBy: 'newest'
    });
  };

  // Get game filter from URL
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const gameParam = params.get('game');
    if (gameParam && gameParam !== 'all') {
      setFilters(prev => ({ ...prev, game: gameParam }));
    }
  }, [location]);

  // Apply filters
  useEffect(() => {
    console.log('Applying filters...');
    console.log('Original accounts:', accounts.length);
    console.log('Current filters:', filters);
    
    let filtered = [...accounts];
    console.log('Starting with accounts:', filtered.length);

    // Game filter
    if (filters.game && filters.game !== 'all') {
      filtered = filtered.filter(account => account.game === filters.game);
      console.log('After game filter:', filtered.length);
    }

    // Price range filter
    if (filters.priceMin) {
      filtered = filtered.filter(account => account.price >= parseFloat(filters.priceMin));
      console.log('After price min filter:', filtered.length);
    }
    if (filters.priceMax) {
      filtered = filtered.filter(account => account.price <= parseFloat(filters.priceMax));
      console.log('After price max filter:', filtered.length);
    }


    // Sort
    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.seller?.rating || 0) - (a.seller?.rating || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    console.log('Final filtered accounts:', filtered.length);
    setFilteredAccounts(filtered);
    setCurrentPage(1);
  }, [accounts, filters]);

  const handleAccountClick = (accountId: string) => {
    window.location.href = `/account/${accountId}`;
  };

  const handleViewProduct = (accountId: string) => {
    window.location.href = `/account/${accountId}`;
  };

  const handleContactSeller = (sellerId: string, accountId: string) => {
    // Navigate to chat page with account ID
    window.location.href = `/chat/${accountId}`;
  };


  if (loading) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading accounts...</p>
        </div>
      </div>
    );
  }

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
                <div className="flex justify-between items-center">
                  <CardTitle>Filters</CardTitle>
                  <Button 
                    onClick={resetFilters}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Reset
                  </Button>
                </div>
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
                      <SelectItem value="all">All Games</SelectItem>
                      <SelectItem value="fc26">FC 26</SelectItem>
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
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold">Available Accounts</h2>
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <i className="fas fa-sync-alt"></i>
                  <span>Refresh</span>
                </Button>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span data-testid="results-count">{filteredAccounts.length}</span>
                <span>results found</span>
              </div>
            </div>

            {/* Account Listings Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8" data-testid="accounts-grid">
              {paginatedAccounts.map((account: AccountWithSeller) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onClick={handleAccountClick}
                  onContactSeller={handleContactSeller}
                />
              ))}
            </div>

            {filteredAccounts.length === 0 && (
              <div className="text-center py-12">
                <i className="fas fa-search text-muted-foreground text-4xl mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">No accounts found</h3>
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
