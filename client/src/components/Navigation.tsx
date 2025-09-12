import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navigation: React.FC = () => {
  const [location] = useLocation();
  const { currentUser, userProfile, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 4) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (level >= 3) return 'bg-gradient-to-r from-green-500 to-blue-500';
    if (level >= 2) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    return 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  return (
    <nav className="navbar-blur border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <i className="fas fa-gamepad text-primary text-2xl"></i>
              <span className="text-xl font-bold text-foreground">GameVault</span>
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/marketplace" className={`text-muted-foreground hover:text-primary transition-colors ${location === '/marketplace' ? 'text-primary' : ''}`}>
                Marketplace
              </Link>
              {currentUser && (
                <>
                  <Link href="/wallet" className={`text-muted-foreground hover:text-primary transition-colors ${location === '/wallet' ? 'text-primary' : ''}`}>
                    Wallet
                  </Link>
                  <Link href="/dashboard" className={`text-muted-foreground hover:text-primary transition-colors ${location === '/dashboard' ? 'text-primary' : ''}`}>
                    Orders
                  </Link>
                  <Link href="/support" className={`text-muted-foreground hover:text-primary transition-colors ${location === '/support' ? 'text-primary' : ''}`}>
                    Support
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentUser && userProfile ? (
              <>
                <div className="hidden md:flex items-center space-x-3 bg-card border border-border rounded-lg px-3 py-2">
                  <i className="fas fa-wallet text-primary"></i>
                  <span className="text-sm font-medium" data-testid="wallet-balance">
                    ${userProfile.walletBalance.toFixed(2)}
                  </span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 bg-card border border-border rounded-lg px-3 py-2" data-testid="user-menu">
                      <Badge className={`text-xs font-bold px-2 py-1 rounded text-white ${getLevelColor(userProfile.level)}`}>
                        LV {userProfile.level}
                      </Badge>
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {userProfile.username[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden sm:block text-sm font-medium">
                        {userProfile.username}
                      </span>
                      <i className="fas fa-chevron-down text-xs text-muted-foreground"></i>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <i className="fas fa-tachometer-alt mr-2"></i>
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wallet" className="cursor-pointer">
                        <i className="fas fa-wallet mr-2"></i>
                        Wallet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/sell" className="cursor-pointer">
                        <i className="fas fa-plus mr-2"></i>
                        Sell Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {userProfile.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <i className="fas fa-shield-alt mr-2"></i>
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="cursor-pointer text-destructive focus:text-destructive"
                      data-testid="logout-button"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" data-testid="login-button">Login</Button>
                </Link>
                <Link href="/login">
                  <Button className="gradient-primary" data-testid="signup-button">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
