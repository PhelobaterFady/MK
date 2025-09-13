import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import LevelProgress from '@/components/LevelProgress';
import { formatCurrencySymbol } from '@/utils/currency';
import { getUserOrders, getUserGameAccounts, getUser, confirmOrderDelivery, addAccountDetails, getGameAccount } from '@/services/firebase-api';
import { calculateTotalRequiredTransactions } from '@/utils/levelSystem';
import { updateUserLevel } from '@/utils/levelUpdater';
import { Order, GameAccount } from '@shared/schema';
import { useLocation } from 'wouter';
import AccountDetailsModal from '@/components/AccountDetailsModal';
import ConfirmOrderModal from '@/components/ConfirmOrderModal';
import AddAccountDetailsModal from '@/components/AddAccountDetailsModal';
import PurchaseConfirmationModal from '@/components/PurchaseConfirmationModal';
import AccountCredentialsModal from '@/components/AccountCredentialsModal';

const Dashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('completed-orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<Order[]>([]);
  const [gameAccounts, setGameAccounts] = useState<GameAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{[key: string]: any}>({});
  
  // Modal states
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showConfirmOrder, setShowConfirmOrder] = useState(false);
  const [showAddAccountDetails, setShowAddAccountDetails] = useState(false);
  const [showPurchaseConfirmation, setShowPurchaseConfirmation] = useState(false);
  const [showAccountCredentials, setShowAccountCredentials] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedAccountForPurchase, setSelectedAccountForPurchase] = useState<GameAccount | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Auto-recalculate user level based on actual orders
  const recalculateUserLevel = async (userId: string, orders: Order[]) => {
    try {
      const totalValue = orders.reduce((sum, order) => sum + (order.amount || order.price || 0), 0);
      
      // Reset totalTransactionValue to 0 first
      const { ref, update } = await import('firebase/database');
      const { database } = await import('@/lib/firebase');
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, { totalTransactionValue: 0 });
      
      // Then update with correct total
      await updateUserLevel(userId, totalValue);
      console.log(`✅ Auto-recalculated level for user ${userId}: ${totalValue} EGP`);
    } catch (error) {
      console.error('Error auto-recalculating level:', error);
    }
  };

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const [userOrders, userGameAccounts] = await Promise.all([
          getUserOrders(currentUser.uid),
          getUserGameAccounts(currentUser.uid)
        ]);
        
        // Filter orders: User Dashboard shows only orders where user is the BUYER
        const buyerOrders = userOrders.filter(order => order.buyerId === currentUser.uid);
        console.log('🔍 Debug - All user orders:', userOrders.length);
        console.log('🔍 Debug - Buyer orders:', buyerOrders.length);
        console.log('🔍 Debug - Buyer order IDs:', buyerOrders.map(o => o.id));
        console.log('🔍 Debug - Buyer orders details:', buyerOrders);
        
        // Remove duplicates by order ID
        const uniqueBuyerOrders = buyerOrders.filter((order, index, self) => 
          index === self.findIndex(o => o.id === order.id)
        );
        console.log('🔍 Debug - Unique buyer orders:', uniqueBuyerOrders.length);
        console.log('🔍 Debug - Unique buyer order IDs:', uniqueBuyerOrders.map(o => o.id));
        
        setOrders(uniqueBuyerOrders);
        setAllOrders(userOrders); // Store all orders for history tab
        setPurchaseOrders(uniqueBuyerOrders); // Store only unique purchase orders for Orders History
        setGameAccounts(userGameAccounts);
        
        // Load all game accounts referenced in orders
        const accountIds = new Set<string>();
        uniqueBuyerOrders.forEach(order => {
          if (order.accountId) {
            accountIds.add(order.accountId);
          }
        });
        
        console.log('🔍 Debug - Account IDs in orders:', Array.from(accountIds));
        console.log('🔍 Debug - Orders without accountId:', uniqueBuyerOrders.filter(o => !o.accountId).map(o => ({ id: o.id, gameAccountTitle: o.gameAccountTitle })));
        
        // Load all referenced game accounts
        const allReferencedAccounts: GameAccount[] = [];
        for (const accountId of Array.from(accountIds)) {
          try {
            const account = await getGameAccount(accountId);
            if (account) {
              allReferencedAccounts.push(account);
              console.log('🔍 Debug - Loaded account:', accountId, account.title);
            } else {
              console.log('🔍 Debug - Account not found:', accountId);
            }
          } catch (error) {
            console.error('Error loading account:', accountId, error);
          }
        }
        
        console.log('🔍 Debug - All referenced accounts:', allReferencedAccounts.length);
        console.log('🔍 Debug - User game accounts:', userGameAccounts.length);
        
        // Also try to extract account info from orders without accountId
        const ordersWithoutAccountId = uniqueBuyerOrders.filter(o => !o.accountId);
        console.log('🔍 Debug - Processing orders without accountId:', ordersWithoutAccountId.length);
        
        ordersWithoutAccountId.forEach(order => {
          console.log('🔍 Debug - Order without accountId:', {
            id: order.id,
            gameAccountTitle: order.gameAccountTitle,
            hasAccountDetails: !!order.accountDetails,
            accountDetails: order.accountDetails
          });
          
          // Try to extract account info from accountDetails
          if (order.accountDetails) {
            try {
              const accountDetails = typeof order.accountDetails === 'string' 
                ? JSON.parse(order.accountDetails) 
                : order.accountDetails;
              
              console.log('🔍 Debug - Parsed accountDetails for order', order.id, ':', accountDetails);
              
              // Check if we can extract useful info
              if (accountDetails.title || accountDetails.name || accountDetails.game) {
                console.log('🔍 Debug - Found useful account info in order', order.id);
              }
            } catch (error) {
              console.log('🔍 Debug - Error parsing accountDetails for order', order.id, ':', error);
            }
          }
        });
        
        setGameAccounts([...userGameAccounts, ...allReferencedAccounts]);
        
        // Auto-recalculate level based on all user orders (buyer + seller)
        await recalculateUserLevel(currentUser.uid, userOrders);
        
        // Load user data for orders
        const userIds = new Set<string>();
        buyerOrders.forEach(order => {
          userIds.add(order.buyerId);
          userIds.add(order.sellerId);
        });
        
        const userDataMap: {[key: string]: any} = {};
        for (const userId of Array.from(userIds)) {
          try {
            const user = await getUser(userId);
            userDataMap[userId] = user;
          } catch (error) {
            console.error('Error loading user data:', error);
            userDataMap[userId] = { displayName: 'Unknown User', email: 'No email' };
          }
        }
        setUserData(userDataMap);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [currentUser]);

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

  const getAccountTitle = (order: Order) => {
    console.log('=== GET ACCOUNT TITLE DEBUG ===');
    console.log('Order ID:', order.id);
    console.log('Order accountId:', order.accountId);
    console.log('Order gameAccountTitle:', order.gameAccountTitle);
    console.log('Order notes:', order.notes);
    console.log('Order accountDetails:', order.accountDetails);
    console.log('Available gameAccounts:', gameAccounts.length);
    console.log('GameAccounts IDs:', gameAccounts.map(acc => acc.id));
    console.log('GameAccounts titles:', gameAccounts.map(acc => acc.title));
    
    // First try to find in local gameAccounts
    const localAccount = gameAccounts.find(acc => acc.id === order.accountId);
    console.log('Found local account:', localAccount);
    
    if (localAccount && localAccount.title) {
      console.log('Using local account title:', localAccount.title);
      return localAccount.title;
    }
    
    // If not found locally, try to get from order data
    if (order.gameAccountTitle && order.gameAccountTitle !== 'Game Account Order') {
      console.log('Using order gameAccountTitle:', order.gameAccountTitle);
      return order.gameAccountTitle;
    }
    
    // Try to extract title from order data
    if (order.accountDetails) {
      try {
        const accountDetails = typeof order.accountDetails === 'string' 
          ? JSON.parse(order.accountDetails) 
          : order.accountDetails;
        
        console.log('Parsed accountDetails:', accountDetails);
        
        if (accountDetails.title) {
          console.log('Using accountDetails title:', accountDetails.title);
          return accountDetails.title;
        }
        
        // Try other possible title fields
        if (accountDetails.name) {
          console.log('Using accountDetails name:', accountDetails.name);
          return accountDetails.name;
        }
        
        if (accountDetails.accountName) {
          console.log('Using accountDetails accountName:', accountDetails.accountName);
          return accountDetails.accountName;
        }
        
        // Try to extract from game field
        if (accountDetails.game) {
          console.log('Using accountDetails game:', accountDetails.game);
          return `${accountDetails.game} Account`;
        }
        
        // Try to extract from any field that might contain the account name
        const possibleNameFields = ['accountName', 'displayName', 'characterName', 'playerName', 'ign', 'inGameName', 'nickname', 'alias', 'character', 'account', 'username', 'login'];
        for (const field of possibleNameFields) {
          if (accountDetails[field]) {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields = Object.keys(accountDetails);
        const nameLikeFields = allFields.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any text field (but prioritize meaningful names)
        const priorityFields = ['character', 'account', 'username', 'login', 'player', 'ign', 'nickname'];
        const fallbackFields = ['email'];
        
        // First try priority fields
        for (const field of priorityFields) {
          if (accountDetails[field]) {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Then try fallback fields (but don't show field name)
        for (const field of fallbackFields) {
          if (accountDetails[field]) {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            // For email, try to extract a meaningful name
            if (field === 'email') {
              const email = accountDetails[field];
              const emailName = email.split('@')[0];
              console.log(`Extracted name from email:`, emailName);
              return emailName;
            }
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields2 = Object.keys(accountDetails);
        const nameLikeFields2 = allFields2.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields2) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields3 = Object.keys(accountDetails);
        const nameLikeFields3 = allFields3.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields3) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields4 = Object.keys(accountDetails);
        const nameLikeFields4 = allFields4.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields4) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields5 = Object.keys(accountDetails);
        const nameLikeFields5 = allFields5.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields5) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields6 = Object.keys(accountDetails);
        const nameLikeFields6 = allFields6.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields6) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields7 = Object.keys(accountDetails);
        const nameLikeFields7 = allFields7.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields7) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields8 = Object.keys(accountDetails);
        const nameLikeFields8 = allFields8.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields8) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields9 = Object.keys(accountDetails);
        const nameLikeFields9 = allFields9.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields9) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields10 = Object.keys(accountDetails);
        const nameLikeFields10 = allFields10.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields10) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields11 = Object.keys(accountDetails);
        const nameLikeFields11 = allFields11.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields11) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields12 = Object.keys(accountDetails);
        const nameLikeFields12 = allFields12.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields12) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields13 = Object.keys(accountDetails);
        const nameLikeFields13 = allFields13.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields13) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields14 = Object.keys(accountDetails);
        const nameLikeFields14 = allFields14.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields14) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields15 = Object.keys(accountDetails);
        const nameLikeFields15 = allFields15.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields15) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields16 = Object.keys(accountDetails);
        const nameLikeFields16 = allFields16.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields16) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields17 = Object.keys(accountDetails);
        const nameLikeFields17 = allFields17.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields17) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields18 = Object.keys(accountDetails);
        const nameLikeFields18 = allFields18.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields18) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields19 = Object.keys(accountDetails);
        const nameLikeFields19 = allFields19.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields19) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields20 = Object.keys(accountDetails);
        const nameLikeFields20 = allFields20.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields20) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields21 = Object.keys(accountDetails);
        const nameLikeFields21 = allFields21.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields21) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields22 = Object.keys(accountDetails);
        const nameLikeFields22 = allFields22.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields22) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields23 = Object.keys(accountDetails);
        const nameLikeFields23 = allFields23.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields23) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields24 = Object.keys(accountDetails);
        const nameLikeFields24 = allFields24.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields24) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields25 = Object.keys(accountDetails);
        const nameLikeFields25 = allFields25.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields25) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
        
        // Try to extract from any field that might contain the account name (case insensitive)
        const allFields26 = Object.keys(accountDetails);
        const nameLikeFields26 = allFields26.filter(field => 
          field.toLowerCase().includes('name') || 
          field.toLowerCase().includes('character') || 
          field.toLowerCase().includes('player') ||
          field.toLowerCase().includes('ign') ||
          field.toLowerCase().includes('nick') ||
          field.toLowerCase().includes('account') ||
          field.toLowerCase().includes('user') ||
          field.toLowerCase().includes('login')
        );
        
        for (const field of nameLikeFields26) {
          if (accountDetails[field] && typeof accountDetails[field] === 'string') {
            console.log(`Using accountDetails ${field}:`, accountDetails[field]);
            return accountDetails[field];
          }
        }
      } catch (error) {
        console.log('Error parsing accountDetails:', error);
      }
    }
    
    // Try to extract from order notes or other fields
    if (order.notes && order.notes !== 'Account details not available') {
      console.log('Using order notes:', order.notes);
      return order.notes.length > 50 ? order.notes.substring(0, 50) + '...' : order.notes;
    }
    
    // Try to extract from order ID (remove prefix)
    if (order.id && order.id.startsWith('GV-')) {
      const timestamp = order.id.replace('GV-', '');
      const date = new Date(parseInt(timestamp));
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log('Using formatted date from order ID:', formattedDate);
      return `Account from ${formattedDate}`;
    }
    
    // Try to extract from order price and status
    if (order.price) {
      const priceText = order.price > 0 ? `${order.price} EGP` : 'Free';
      console.log('Using price-based title:', priceText);
      return `${priceText} Account`;
    }
    
    // Final fallback with more descriptive name
    const fallbackTitle = `Game Account #${order.id}`;
    console.log('Using final fallback title:', fallbackTitle);
    return fallbackTitle;
  };

  const getLevelProgress = () => {
    const currentLevel = userProfile.accountLevel || userProfile.level || 1;
    const totalValue = userProfile.totalTransactionValue || 0;
    
    // Calculate progress to next level
    const currentLevelRequired = calculateTotalRequiredTransactions(currentLevel);
    const nextLevelRequired = calculateTotalRequiredTransactions(currentLevel + 1);
    const currentLevelTransactions = totalValue - currentLevelRequired;
    const progress = Math.min(100, (currentLevelTransactions / (nextLevelRequired - currentLevelRequired)) * 100);
    
    return Math.max(0, progress);
  };

  // Modal handlers
  const handleShowAccountDetails = async (order: Order) => {
    try {
      // Get account details from gameAccounts
      const account = gameAccounts.find(acc => acc.id === order.accountId);
      if (account) {
        setSelectedAccount(account);
        setShowAccountDetails(true);
      } else {
        // If not found in gameAccounts, create a basic account object
        setSelectedAccount({
          id: order.accountId,
          title: order.gameAccountTitle || 'Game Account',
          game: 'Unknown Game',
          description: 'Account details not available',
          price: order.price || 0,
          images: [],
          features: [],
          sellerId: order.sellerId,
          status: 'active',
          createdAt: order.createdAt.toISOString()
        });
        setShowAccountDetails(true);
      }
    } catch (error) {
      console.error('Error loading account details:', error);
    }
  };

  const handleConfirmOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowConfirmOrder(true);
  };

  const handleAddAccountDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowAddAccountDetails(true);
  };


  const handleConfirmOrderSubmit = async () => {
    if (!selectedOrder) return;
    
    try {
      // Update order status to 'delivered' and transfer money
      await confirmOrderDelivery(selectedOrder.id);
      
      // Refresh orders data
      if (currentUser) {
        const [userOrders, userGameAccounts] = await Promise.all([
          getUserOrders(currentUser.uid),
          getUserGameAccounts(currentUser.uid)
        ]);
        // Filter orders: User Dashboard shows only orders where user is the BUYER
        const buyerOrders = userOrders.filter(order => order.buyerId === currentUser.uid);
        setOrders(buyerOrders);
        setAllOrders(userOrders); // Store all orders for history tab
        setPurchaseOrders(buyerOrders); // Store only purchase orders for Orders History
        setGameAccounts(userGameAccounts);
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      throw error;
    }
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedAccountForPurchase || !currentUser) return;
    
    try {
      setPurchaseLoading(true);
      
      // Create order
      const { createOrder } = await import('@/services/firebase-api');
      const orderData = {
        buyerId: currentUser.uid,
        sellerId: selectedAccountForPurchase.sellerId,
        accountId: selectedAccountForPurchase.id,
        gameAccountTitle: selectedAccountForPurchase.title,
        amount: selectedAccountForPurchase.price,
        price: selectedAccountForPurchase.price,
        escrowAmount: selectedAccountForPurchase.price,
        status: 'escrow' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await createOrder(orderData);
      
      // Refresh orders data
      const [userOrders, userGameAccounts] = await Promise.all([
        getUserOrders(currentUser.uid),
        getUserGameAccounts(currentUser.uid)
      ]);
      const buyerOrders = userOrders.filter(order => order.buyerId === currentUser.uid);
      setOrders(buyerOrders);
      setAllOrders(userOrders); // Store all orders for history tab
      setGameAccounts(userGameAccounts);
      
      setShowPurchaseConfirmation(false);
      setSelectedAccountForPurchase(null);
      
      // Navigate to awaiting confirm tab
      setActiveTab('awaiting-confirm');
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleAddAccountDetailsSubmit = async (details: any) => {
    if (!selectedOrder) return;
    
    try {
      // Update order status to 'awaiting_confirmation' and save account details
      await addAccountDetails(selectedOrder.id, details);
      
      // Refresh orders data
      if (currentUser) {
        const [userOrders, userGameAccounts] = await Promise.all([
          getUserOrders(currentUser.uid),
          getUserGameAccounts(currentUser.uid)
        ]);
        // Filter orders: User Dashboard shows only orders where user is the BUYER
        const buyerOrders = userOrders.filter(order => order.buyerId === currentUser.uid);
        setOrders(buyerOrders);
        setAllOrders(userOrders); // Store all orders for history tab
        setPurchaseOrders(buyerOrders); // Store only purchase orders for Orders History
        setGameAccounts(userGameAccounts);
      }
    } catch (error) {
      console.error('Error adding account details:', error);
      throw error;
    }
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
                  {formatCurrencySymbol(userProfile.walletBalance)}
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

          <LevelProgress 
            level={userProfile.accountLevel || userProfile.level || 1} 
            totalTransactionValue={userProfile.totalTransactionValue || 0}
            className="md:col-span-1"
          />
                </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/selling-dashboard')}
                className="flex items-center space-x-2"
              >
                <i className="fas fa-store"></i>
                <span>Selling Dashboard</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/sell')}
                className="flex items-center space-x-2"
              >
                <i className="fas fa-plus"></i>
                <span>Create Listing</span>
              </Button>
              </div>
            </CardContent>
          </Card>

        {/* Dashboard Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="completed-orders" data-testid="completed-orders-tab">
                  Completed Orders
                </TabsTrigger>
                <TabsTrigger value="awaiting-confirm" data-testid="awaiting-confirm-tab">
                  Awaiting Confirm Orders
                </TabsTrigger>
                <TabsTrigger value="order-history" data-testid="order-history-tab">
                  Orders History
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="completed-orders" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading orders...</span>
                  </div>
                ) : orders.filter(order => 
                  order.buyerId === currentUser?.uid && order.status === 'delivered'
                ).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-check-circle text-4xl mb-4"></i>
                    <p>No completed orders</p>
                    <p className="text-sm">Your completed orders will appear here</p>
                  </div>
                ) : (
                  orders.filter(order => 
                    order.buyerId === currentUser?.uid && order.status === 'delivered'
                  ).map((order) => (
                  <Card key={order.id} className="border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2" data-testid={`order-title-${order.id}`}>
                            {getAccountTitle(order)}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono" data-testid={`order-id-${order.id}`}>
                              #{order.id}
                            </span>
                            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                              {order.status === 'escrow' ? 'Awaiting Account Details' : 
                               order.status === 'delivered' ? 'Delivered' : order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <span 
                            className={`text-xl font-bold ${order.buyerId === currentUser?.uid ? 'text-primary' : 'text-green-400'}`}
                            data-testid={`order-amount-${order.id}`}
                          >
                            {order.buyerId === currentUser?.uid ? '' : '+'}{formatCurrencySymbol(order.amount || order.price || 0)}
                            {/* Debug: {JSON.stringify({price: order.price, id: order.id})} */}
                          </span>
                          <p className="text-sm text-muted-foreground">{order.createdAt.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-foreground">
                              {order.buyerId === currentUser?.uid ? 'S' : 'B'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {order.buyerId === currentUser?.uid ? 'You (Buyer)' : 'You (Seller)'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.buyerId === currentUser?.uid ? 'Purchase' : 'Sale'}
                            </p>
                            <div className="text-xs text-muted-foreground mt-1">
                              <p><strong>Buyer:</strong> {userData[order.buyerId]?.displayName || 'Unknown'}</p>
                              <p><strong>Seller:</strong> {userData[order.sellerId]?.displayName || 'Unknown'}</p>
                            </div>
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
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`show-details-${order.id}`}
                            onClick={() => handleShowAccountDetails(order)}
                          >
                            <i className="fas fa-eye mr-1"></i>
                            Show Account Details
                          </Button>
                          {order.accountDetails && order.status === 'awaiting_confirmation' && order.buyerId === currentUser?.uid && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`confirm-order-${order.id}`}
                              onClick={() => handleConfirmOrder(order)}
                            >
                              <i className="fas fa-check mr-1"></i>
                              Confirm Order
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="awaiting-confirm" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading orders...</span>
                  </div>
                ) : orders.filter(order => 
                  order.buyerId === currentUser?.uid && 
                  (order.status === 'escrow' || order.status === 'delivering' || order.status === 'awaiting_confirmation')
                ).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-clock text-4xl mb-4"></i>
                    <p>No orders awaiting confirmation</p>
                    <p className="text-sm">Orders waiting for confirmation will appear here</p>
                  </div>
                ) : (
                  orders.filter(order => 
                    order.buyerId === currentUser?.uid && 
                    (order.status === 'escrow' || order.status === 'delivering' || order.status === 'awaiting_confirmation')
                  ).map((order) => (
                  <Card key={order.id} className="border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">
                            {getAccountTitle(order)}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono">#{order.id}</span>
                            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                              {order.status === 'escrow' ? 'Awaiting Account Details' : 
                               order.status === 'delivering' ? 'Delivering' :
                               order.status === 'awaiting_confirmation' ? 'Awaiting Confirmation' : 
                               order.status === 'delivered' ? 'Delivered' : order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-primary">
                            {formatCurrencySymbol(order.amount || order.price || 0)}
                          </span>
                          <p className="text-sm text-muted-foreground">{order.createdAt.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-foreground">B</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">You (Buyer)</p>
                            <p className="text-xs text-muted-foreground">Purchase</p>
                            <div className="text-xs text-muted-foreground mt-1">
                              <p><strong>Buyer:</strong> {userData[order.buyerId]?.displayName || 'Unknown'}</p>
                              <p><strong>Seller:</strong> {userData[order.sellerId]?.displayName || 'Unknown'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <i className="fas fa-comment mr-1"></i>
                            Chat
                  </Button>
                          {order.accountDetails && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowAccountCredentials(true);
                              }}
                            >
                              <i className="fas fa-key mr-1"></i>
                              Show Account Details
                            </Button>
                          )}
                          {order.accountDetails && order.status === 'awaiting_confirmation' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleConfirmOrder(order)}
                            >
                              <i className="fas fa-check mr-1"></i>
                              Confirm Order
                            </Button>
                          )}
                </div>
                </div>
                    </CardContent>
                  </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="order-history">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2">Loading orders...</span>
                </div>
                ) : purchaseOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <i className="fas fa-history text-4xl mb-4"></i>
                    <p>No purchase history</p>
                    <p className="text-sm">Your purchase history will appear here</p>
                      </div>
                ) : (
                  purchaseOrders.map((order) => {
                    console.log('🔍 Orders History - Rendering order:', order.id, 'Status:', order.status, 'Buyer:', order.buyerId, 'Seller:', order.sellerId);
                    return (
                  <Card key={order.id} className="border border-border">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                      <div>
                          <h3 className="font-semibold text-lg mb-2">
                            {getAccountTitle(order)}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono">#{order.id}</span>
                            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                              {order.status === 'escrow' ? 'Awaiting Account Details' : 
                               order.status === 'delivering' ? 'Delivering' :
                               order.status === 'awaiting_confirmation' ? 'Awaiting Confirmation' : 
                               order.status === 'delivered' ? 'Delivered' : order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-bold ${order.buyerId === currentUser?.uid ? 'text-primary' : 'text-green-400'}`}>
                            {order.buyerId === currentUser?.uid ? '' : '+'}{formatCurrencySymbol(order.amount || order.price || 0)}
                          </span>
                          <p className="text-sm text-muted-foreground">{order.createdAt.toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-xs text-primary-foreground">
                              {order.buyerId === currentUser?.uid ? 'B' : 'S'}
                            </span>
                      </div>
                      <div>
                            <p className="text-sm font-medium">
                              {order.buyerId === currentUser?.uid ? 'You (Buyer)' : 'You (Seller)'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.buyerId === currentUser?.uid ? 'Purchase' : 'Sale'}
                            </p>
                            <div className="text-xs text-muted-foreground mt-1">
                              <p><strong>Buyer:</strong> {userData[order.buyerId]?.displayName || 'Unknown'}</p>
                              <p><strong>Seller:</strong> {userData[order.sellerId]?.displayName || 'Unknown'}</p>
                      </div>
                      </div>
                    </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <i className="fas fa-comment mr-1"></i>
                            Chat
                          </Button>
                  </div>
                </div>
                    </CardContent>
                  </Card>
                    );
                  })
                )}
              </TabsContent>


            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Modals */}
      <AccountDetailsModal
        isOpen={showAccountDetails}
        onClose={() => setShowAccountDetails(false)}
        accountData={selectedAccount}
      />

      <ConfirmOrderModal
        isOpen={showConfirmOrder}
        onClose={() => setShowConfirmOrder(false)}
        onConfirm={handleConfirmOrderSubmit}
        orderData={selectedOrder ? {
          id: selectedOrder.id,
          gameAccountTitle: selectedOrder.gameAccountTitle || 'Game Account',
          price: selectedOrder.price || 0,
          buyerName: userData[selectedOrder.buyerId]?.displayName || 'Unknown',
          sellerName: userData[selectedOrder.sellerId]?.displayName || 'Unknown'
        } : null}
      />

      <AddAccountDetailsModal
        isOpen={showAddAccountDetails}
        onClose={() => setShowAddAccountDetails(false)}
        onSubmit={handleAddAccountDetailsSubmit}
        orderData={selectedOrder ? {
          id: selectedOrder.id,
          gameAccountTitle: selectedOrder.gameAccountTitle || 'Game Account',
          price: selectedOrder.price || 0,
          buyerName: userData[selectedOrder.buyerId]?.displayName || 'Unknown'
        } : null}
      />


      <PurchaseConfirmationModal
        isOpen={showPurchaseConfirmation}
        onClose={() => setShowPurchaseConfirmation(false)}
        onConfirm={handlePurchaseConfirm}
        account={selectedAccountForPurchase}
        loading={purchaseLoading}
      />

      <AccountCredentialsModal
        isOpen={showAccountCredentials}
        onClose={() => setShowAccountCredentials(false)}
        orderData={selectedOrder ? {
          id: selectedOrder.id,
          gameAccountTitle: selectedOrder.gameAccountTitle || 'Game Account',
          price: selectedOrder.price || 0,
          status: selectedOrder.status,
          accountDetails: selectedOrder.accountDetails ? 
            (typeof selectedOrder.accountDetails === 'string' ? 
              JSON.parse(selectedOrder.accountDetails) : 
              selectedOrder.accountDetails) : 
            undefined
        } : null}
      />
    </div>
  );
};

export default Dashboard;
