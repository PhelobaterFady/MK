import { ref, push, set, get, update, query, orderByChild, equalTo, limitToLast, onValue, off } from 'firebase/database';
import { database } from '../lib/firebase';
import { GameAccount, User, Order, ChatMessage, InsertUser, InsertGameAccount, InsertOrder, InsertChatMessage } from '@shared/schema';

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
    const accountsRef = ref(database, 'gameAccounts');
    const newAccountRef = push(accountsRef);
    const accountId = newAccountRef.key!;
    
    await set(newAccountRef, {
      ...accountData,
      id: accountId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0
    });
    
    return accountId;
  } catch (error) {
    console.error('Error creating game account:', error);
    throw new Error('Failed to create game account');
  }
};

export const getGameAccounts = async (): Promise<GameAccount[]> => {
  try {
    const accountsRef = ref(database, 'gameAccounts');
    const snapshot = await get(accountsRef);
    
    if (snapshot.exists()) {
      const accounts: GameAccount[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        accounts.push({
          ...data,
          id: childSnapshot.key!,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        });
      });
      
      return accounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
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
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
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
    
    return orderId;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = ref(database, 'orders');
    const buyerQuery = query(ordersRef, orderByChild('buyerId'), equalTo(userId));
    const sellerQuery = query(ordersRef, orderByChild('sellerId'), equalTo(userId));
    
    const [buyerSnapshot, sellerSnapshot] = await Promise.all([
      get(buyerQuery),
      get(sellerQuery)
    ]);
    
    const orders: Order[] = [];
    
    if (buyerSnapshot.exists()) {
      buyerSnapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        orders.push({
          ...data,
          id: childSnapshot.key!,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        });
      });
    }
    
    if (sellerSnapshot.exists()) {
      sellerSnapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        orders.push({
          ...data,
          id: childSnapshot.key!,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        });
      });
    }
    
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw new Error('Failed to fetch user orders');
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