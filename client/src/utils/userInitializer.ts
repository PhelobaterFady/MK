import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

// Initialize user level system for existing users
export const initializeUserLevelSystem = async (userId: string) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      console.error('User not found');
      return;
    }
    
    const userData = userSnapshot.val();
    
    // Check if user needs level system initialization
    if (!userData.accountLevel || !userData.totalTransactionValue) {
      const updates: any = {};
      
      // Set default level system values
      if (!userData.accountLevel) {
        updates.accountLevel = userData.level || 1;
      }
      
      if (!userData.totalTransactionValue) {
        // Calculate total transaction value from existing trades
        const totalValue = (userData.totalTrades || 0) * 100; // Mock calculation
        updates.totalTransactionValue = totalValue;
      }
      
      updates.lastUpdated = new Date().toISOString();
      
      await update(userRef, updates);
      
      console.log(`User ${userId} level system initialized`);
    }
  } catch (error) {
    console.error('Error initializing user level system:', error);
    throw error;
  }
};

// Check and initialize all users
export const initializeAllUsersLevelSystem = async () => {
  try {
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (!usersSnapshot.exists()) {
      console.log('No users found');
      return;
    }
    
    const users = usersSnapshot.val();
    const promises = Object.keys(users).map(userId => 
      initializeUserLevelSystem(userId).catch(error => 
        console.error(`Error initializing user ${userId}:`, error)
      )
    );
    
    await Promise.all(promises);
    console.log('All users level system initialized');
  } catch (error) {
    console.error('Error initializing all users level system:', error);
    throw error;
  }
};
