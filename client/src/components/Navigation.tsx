import React, { useState, useEffect } from 'react';
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
import { database } from '../lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { getRankForLevel } from '@/utils/levelSystem';
import { formatCurrencySymbol } from '@/utils/currency';

const Navigation: React.FC = () => {
  const [location] = useLocation();
  const { currentUser, userProfile, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Monitor unread messages
  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = ref(database, 'chats');
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUnreadMessagesCount(0);
        return;
      }

      const chatsData = snapshot.val();
      let totalUnread = 0;

      Object.entries(chatsData).forEach(([chatId, chatData]: [string, any]) => {
        const participants = chatId.split('_');
        if (participants.includes(currentUser.uid) && chatData.messages) {
          const messages = Object.values(chatData.messages) as any[];
          const unreadCount = messages.filter(msg => 
            msg.senderId !== currentUser.uid && 
            !msg.readBy?.[currentUser.uid]
          ).length;
          totalUnread += unreadCount;
        }
      });

      setUnreadMessagesCount(totalUnread);
    }, { onlyOnce: false });

    return () => {
      off(chatsRef);
    };
  }, [currentUser]);

  const getLevelColor = (level: number) => {
    const rank = getRankForLevel(level);
    return rank.color;
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
                   <Link href="/" className="flex items-center space-x-6 group">
                     <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 overflow-hidden rounded-full">
                       <img 
                         src="/monkeyicn.png" 
                         alt="Monly King Logo" 
                         className="w-12 h-12 object-cover"
                       />
                     </div>
                     <span className="text-lg font-black bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">Monly King</span>
                   </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/marketplace" className={`relative text-muted-foreground hover:text-primary transition-all duration-300 px-3 py-2 rounded-lg hover:bg-secondary/20 ${location === '/marketplace' ? 'text-primary bg-secondary/30' : ''}`}>
                <i className="fas fa-store mr-2"></i>
                Marketplace
              </Link>
              {currentUser && (
                <>
                  <Link href="/wallet" className={`relative text-muted-foreground hover:text-primary transition-all duration-300 px-3 py-2 rounded-lg hover:bg-secondary/20 ${location === '/wallet' ? 'text-primary bg-secondary/30' : ''}`}>
                    <i className="fas fa-wallet mr-2"></i>
                    Wallet
                  </Link>
                  <Link href="/dashboard" className={`relative text-muted-foreground hover:text-primary transition-all duration-300 px-3 py-2 rounded-lg hover:bg-secondary/20 ${location === '/dashboard' ? 'text-primary bg-secondary/30' : ''}`}>
                    <i className="fas fa-chart-line mr-2"></i>
                    Orders
                  </Link>
                  <Link href="/support" className={`relative text-muted-foreground hover:text-primary transition-all duration-300 px-3 py-2 rounded-lg hover:bg-secondary/20 ${location === '/support' ? 'text-primary bg-secondary/30' : ''}`}>
                    <i className="fas fa-headset mr-2"></i>
                    Support
                  </Link>
                </>
              )}
            </div>
          </div>
          
                 <div className="flex items-center space-x-2">

                   {currentUser && userProfile ? (
                     <>
                       {/* Mobile Chat Button */}
                       <Link href="/chat">
                         <Button
                           variant="ghost"
                           size="sm"
                           className="md:hidden relative flex items-center space-x-2 bg-card border border-border rounded-lg px-3 py-2 hover:bg-secondary/50"
                         >
                           <i className="fas fa-comments text-primary"></i>
                           {unreadMessagesCount > 0 && (
                             <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                               {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                             </Badge>
                           )}
                         </Button>
                       </Link>

                       <div className="hidden md:flex items-center space-x-2 bg-gradient-card border border-primary/30 rounded-lg px-3 py-1.5 glow-accent">
                         <i className="fas fa-wallet text-accent pulse-glow"></i>
                         <span className="text-sm font-medium text-accent" data-testid="wallet-balance">
                           {formatCurrencySymbol(userProfile.walletBalance)}
                         </span>
                       </div>

                       {/* Desktop Chat Button */}
                       <Link href="/chat">
                         <Button
                           variant="ghost"
                           size="sm"
                           className="hidden md:flex relative items-center space-x-2 bg-card border border-border rounded-lg px-3 py-1.5 hover:bg-secondary/50"
                         >
                           <i className="fas fa-comments text-primary"></i>
                           <span className="text-sm">Chat</span>
                           {unreadMessagesCount > 0 && (
                             <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                               {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                             </Badge>
                           )}
                         </Button>
                       </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 bg-card border border-border rounded-lg px-2 py-1.5" data-testid="user-menu">
                      <Badge className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${getLevelColor(userProfile.accountLevel || userProfile.level)}`}>
                        {getRankForLevel(userProfile.accountLevel || userProfile.level).rank} {userProfile.accountLevel || userProfile.level}
                      </Badge>
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
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
                    {currentUser?.email === 'admin@monlyking.com' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin-dashboard" className="cursor-pointer">
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
