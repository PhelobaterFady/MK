import { ref, push, set, get, update, query, orderByChild, equalTo, limitToLast, onValue, off } from 'firebase/database';
import { database } from '../lib/firebase';
import { GameAccount, User, Order, ChatMessage, InsertUser, InsertGameAccount, InsertOrder, InsertChatMessage } from '@shared/schema';
import { updateUserLevel } from '../utils/levelUpdater';

// User Management
export const createUser = async (userId: string, userData: InsertUser): Promise<void> => {
  try {
    await set(ref(database, `users/${userId}`), {
      ...userData,
      joinDate: userData.joinDate.toISOString(),
      lastActive: new Date().toISOString()
    });
    
    // Reserve username
    if (userData.username) {
      await set(ref(database, `usernames/${userData.username}`), userId);
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        ...data,
        id: userId,
        joinDate: new Date(data.joinDate),
        lastActive: data.lastActive ? new Date(data.lastActive) : undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    const updateData = { ...updates };
    if (updateData.joinDate) {
      updateData.joinDate = updateData.joinDate.toISOString() as any;
    }
    if (updateData.lastActive) {
      updateData.lastActive = updateData.lastActive.toISOString() as any;
    }
    
    await update(ref(database, `users/${userId}`), updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
};

// Game Accounts Management
export const createGameAccount = async (accountData: InsertGameAccount): Promise<string> => {
  try {
    console.log('Creating game account with data:', accountData);
    const accountsRef = ref(database, 'gameAccounts');
    const newAccountRef = push(accountsRef);
    const accountId = newAccountRef.key!;
    
    const accountToSave = {
      ...accountData,
      id: accountId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0
    };
    
    console.log('Saving account to Firebase:', accountToSave);
    await set(newAccountRef, accountToSave);
    console.log('Account saved successfully with ID:', accountId);
    
    return accountId;
  } catch (error) {
    console.error('Error creating game account:', error);
    throw new Error('Failed to create game account');
  }
};

export const getGameAccounts = async (): Promise<GameAccount[]> => {
  try {
    console.log('Fetching game accounts from Firebase...');
    const accountsRef = ref(database, 'gameAccounts');
    const snapshot = await get(accountsRef);
    
    console.log('Firebase snapshot exists:', snapshot.exists());
    console.log('Firebase snapshot value:', snapshot.val());
    
    if (snapshot.exists()) {
      const accounts: GameAccount[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        console.log('Processing account:', childSnapshot.key, data);
        accounts.push({
          ...data,
          id: childSnapshot.key!,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          featuredUntil: data.featuredUntil ? new Date(data.featuredUntil) : undefined
        });
      });
      
      console.log('Total accounts found:', accounts.length);
      console.log('Accounts:', accounts);
      
      return accounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    console.log('No accounts found in Firebase');
    return [];
  } catch (error) {
    console.error('Error fetching game accounts:', error);
    throw new Error('Failed to fetch game accounts');
  }
};

export const getGameAccountsByGame = async (game: string): Promise<GameAccount[]> => {
  try {
    const accountsRef = ref(database, 'gameAccounts');
    const gameQuery = query(accountsRef, orderByChild('game'), equalTo(game));
    const snapshot = await get(gameQuery);
    
    if (snapshot.exists()) {
      const accounts: GameAccount[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        accounts.push({
          ...data,
          id: childSnapshot.key!,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
          featuredUntil: data.featuredUntil ? new Date(data.featuredUntil) : undefined
        });
      });
      
      return accounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching game accounts by game:', error);
    throw new Error('Failed to fetch game accounts');
  }
};

export const getGameAccount = async (accountId: string): Promise<GameAccount | null> => {
  try {
    const accountRef = ref(database, `gameAccounts/${accountId}`);
    const snapshot = await get(accountRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        ...data,
        id: accountId,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching game account:', error);
    throw new Error('Failed to fetch game account');
  }
};

export const incrementAccountViews = async (accountId: string): Promise<void> => {
  try {
    const viewsRef = ref(database, `gameAccounts/${accountId}/views`);
    const snapshot = await get(viewsRef);
    const currentViews = snapshot.exists() ? snapshot.val() : 0;
    
    await set(viewsRef, currentViews + 1);
  } catch (error) {
    console.error('Error incrementing account views:', error);
    // Don't throw error for view counting
  }
};

// Orders Management
export const createOrder = async (orderData: InsertOrder): Promise<string> => {
  try {
    const ordersRef = ref(database, 'orders');
    const newOrderRef = push(ordersRef);
    const orderId = newOrderRef.key!;
    
    await set(newOrderRef, {
      ...orderData,
      id: orderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Note: User levels will be updated when order is confirmed/delivered
    // This prevents double counting when user is both buyer and seller
    
    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};



// Chat Management
export const sendMessage = async (messageData: InsertChatMessage): Promise<void> => {
  try {
    const messagesRef = ref(database, 'chatMessages');
    const newMessageRef = push(messagesRef);
    
    await set(newMessageRef, {
      ...messageData,
      id: newMessageRef.key!,
      timestamp: new Date().toISOString(),
      isRead: false
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

export const getOrderMessages = async (orderId: string): Promise<ChatMessage[]> => {
  try {
    const messagesRef = ref(database, 'chatMessages');
    const orderQuery = query(messagesRef, orderByChild('orderId'), equalTo(orderId));
    const snapshot = await get(orderQuery);
    
    if (snapshot.exists()) {
      const messages: ChatMessage[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        messages.push({
          ...data,
          id: childSnapshot.key!,
          timestamp: new Date(data.timestamp)
        });
      });
      
      return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching order messages:', error);
    throw new Error('Failed to fetch order messages');
  }
};

// Real-time listeners
export const listenToOrderMessages = (orderId: string, callback: (messages: ChatMessage[]) => void): (() => void) => {
  const messagesRef = ref(database, 'chatMessages');
  const orderQuery = query(messagesRef, orderByChild('orderId'), equalTo(orderId));
  
  const unsubscribe = onValue(orderQuery, (snapshot) => {
    const messages: ChatMessage[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        messages.push({
          ...data,
          id: childSnapshot.key!,
          timestamp: new Date(data.timestamp)
        });
      });
    }
    
    callback(messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
  });
  
  return () => off(orderQuery, 'value', unsubscribe);
};

// Get user orders (both as buyer and seller)
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = ref(database, 'orders');
    const ordersSnapshot = await get(ordersRef);
    
    if (!ordersSnapshot.exists()) {
      return [];
    }
    
    const ordersData = ordersSnapshot.val();
    const userOrders: Order[] = [];
    
    // Get orders where user is buyer or seller
    for (const [orderId, orderData] of Object.entries(ordersData)) {
      const order = orderData as any;
      if (order.buyerId === userId || order.sellerId === userId) {
        userOrders.push({
          id: orderId,
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(order.createdAt)
        });
      }
    }
    
    console.log('🔍 Firebase API - getUserOrders for user:', userId);
    console.log('🔍 Firebase API - Total orders found:', userOrders.length);
    console.log('🔍 Firebase API - Order IDs:', userOrders.map(o => o.id));
    
    // Remove duplicates by order ID (just in case)
    const uniqueOrders = userOrders.filter((order, index, self) => 
      index === self.findIndex(o => o.id === order.id)
    );
    
    console.log('🔍 Firebase API - Unique orders after deduplication:', uniqueOrders.length);
    console.log('🔍 Firebase API - Unique order IDs:', uniqueOrders.map(o => o.id));
    
    // Sort by creation date (newest first)
    return uniqueOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw new Error('Failed to get user orders');
  }
};

// Get user's game accounts
export const getUserGameAccounts = async (userId: string): Promise<GameAccount[]> => {
  try {
    const accountsRef = ref(database, 'gameAccounts');
    const accountsSnapshot = await get(accountsRef);
    
    if (!accountsSnapshot.exists()) {
      return [];
    }
    
    const accountsData = accountsSnapshot.val();
    const userAccounts: GameAccount[] = [];
    
    // Get accounts created by this user
    for (const [accountId, accountData] of Object.entries(accountsData)) {
      const account = accountData as any;
      if (account.sellerId === userId) {
        userAccounts.push({
          id: accountId,
          ...account,
          createdAt: new Date(account.createdAt),
          updatedAt: account.updatedAt ? new Date(account.updatedAt) : new Date(account.createdAt)
        });
      }
    }
    
    // Sort by creation date (newest first)
    return userAccounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting user game accounts:', error);
    throw new Error('Failed to get user game accounts');
  }
};

// Order Confirmation and Money Transfer
export const confirmOrderDelivery = async (orderId: string): Promise<void> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);
    
    if (!orderSnapshot.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderSnapshot.val();
    
    // Update order status to 'delivered'
    await update(orderRef, {
      status: 'delivered',
      updatedAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString()
    });
    
    // Transfer money to seller (minus 5% commission) and update levels
    const orderAmount = orderData.amount || orderData.price;
    console.log(`💰 Order ${orderId}: Processing order amount: ${orderAmount} EGP`);
    
    if (orderAmount && orderData.sellerId) {
      console.log(`👤 Processing seller: ${orderData.sellerId}`);
      
      const sellerRef = ref(database, `users/${orderData.sellerId}`);
      const sellerSnapshot = await get(sellerRef);
      
      if (sellerSnapshot.exists()) {
        const sellerData = sellerSnapshot.val();
        const currentBalance = sellerData.walletBalance || 0;
        
        // Calculate commission (5%)
        const commission = orderAmount * 0.05;
        const sellerAmount = orderAmount - commission;
        
        const newBalance = currentBalance + sellerAmount;
        
        await update(sellerRef, {
          walletBalance: newBalance,
          lastUpdated: new Date().toISOString()
        });
        
        console.log(`Order ${orderId}: Seller received ${sellerAmount} EGP (${orderAmount} - ${commission} commission)`);
      } else {
        console.error(`❌ Seller ${orderData.sellerId} not found in database`);
      }
      
      // Update seller level with full amount (for level calculation)
      console.log(`🔄 Updating seller level for ${orderData.sellerId} with amount: ${orderAmount}`);
      try {
        await updateUserLevel(orderData.sellerId, orderAmount);
        console.log(`✅ Seller level updated successfully`);
      } catch (error) {
        console.error(`❌ Failed to update seller level:`, error);
      }
    } else {
      console.error(`❌ Missing orderAmount (${orderAmount}) or sellerId (${orderData.sellerId})`);
    }
    
    // Update buyer level
    if (orderAmount && orderData.buyerId) {
      console.log(`🔄 Updating buyer level for ${orderData.buyerId} with amount: ${orderAmount}`);
      await updateUserLevel(orderData.buyerId, orderAmount);
      console.log(`✅ Buyer level updated successfully`);
    }
  } catch (error) {
    console.error('Error confirming order delivery:', error);
    throw new Error('Failed to confirm order delivery');
  }
};



// Add Account Details
export const addAccountDetails = async (orderId: string, accountDetails: any): Promise<void> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);
    
    if (!orderSnapshot.exists()) {
      throw new Error('Order not found');
    }
    
    // Update order with account details and change status
    await update(orderRef, {
      accountDetails: accountDetails,
      status: 'awaiting_confirmation',
      updatedAt: new Date().toISOString(),
      accountDetailsAddedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error adding account details:', error);
    throw new Error('Failed to add account details');
  }
};

// Update Order Status
export const updateOrderStatus = async (orderId: string, status: string, additionalData?: any): Promise<void> => {
  try {
    const orderRef = ref(database, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);
    
    if (!orderSnapshot.exists()) {
      throw new Error('Order not found');
    }
    
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (additionalData) {
      Object.assign(updateData, additionalData);
    }
    
    await update(orderRef, updateData);
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
};