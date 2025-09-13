import { database } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import { calculateLevelFromTransactions } from './levelSystem';

// Update user level based on transaction value
export const updateUserLevel = async (userId: string, transactionValue: number) => {
  try {
    console.log(`🔍 Starting level update for user: ${userId}, transaction value: ${transactionValue}`);
    
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      console.error(`❌ User ${userId} not found in database`);
      return;
    }
    
    const userData = userSnapshot.val();
    const currentTotalValue = userData.totalTransactionValue || 0;
    const currentLevel = userData.accountLevel || userData.level || 1;
    const newTotalValue = currentTotalValue + transactionValue;
    
    console.log(`📊 Current state - Total value: ${currentTotalValue}, Level: ${currentLevel}`);
    
    // Calculate new level based on total transaction value
    const newLevel = calculateLevelFromTransactions(newTotalValue);
    
    console.log(`📈 New state - Total value: ${newTotalValue}, Level: ${newLevel}`);
    
    // Update user data
    await update(userRef, {
      totalTransactionValue: newTotalValue,
      accountLevel: newLevel,
      level: newLevel, // Also update the level field for compatibility
      lastUpdated: new Date().toISOString()
    });
    
    console.log(`✅ User ${userId} level updated to ${newLevel} (${newTotalValue} EGP total)`);
    console.log(`📊 Level calculation: Previous total: ${currentTotalValue}, Added: ${transactionValue}, New total: ${newTotalValue}`);
    
    return { newLevel, newTotalValue };
  } catch (error) {
    console.error(`❌ Error updating user level for ${userId}:`, error);
    throw error;
  }
};

// Initialize user level system
export const initializeUserLevel = async (userId: string) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const userSnapshot = await get(userRef);
    
    if (!userSnapshot.exists()) {
      console.error('User not found');
      return;
    }
    
    const userData = userSnapshot.val();
    
    // If user doesn't have level system data, initialize it
    if (!userData.accountLevel || !userData.totalTransactionValue) {
      await update(userRef, {
        accountLevel: 1,
        totalTransactionValue: 0,
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error initializing user level:', error);
    throw error;
  }
};
