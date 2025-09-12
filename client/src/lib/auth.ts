import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database } from "./firebase";
import { User as AppUser, InsertUser } from "@shared/schema";

export type { FirebaseUser };

const googleProvider = new GoogleAuthProvider();

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const registerWithEmail = async (email: string, password: string, username: string) => {
  try {
    // Check if username is available
    const usernameRef = ref(database, `usernames/${username}`);
    const usernameSnapshot = await get(usernameRef);
    
    if (usernameSnapshot.exists()) {
      throw new Error("Username is already taken");
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile
    const userData: InsertUser = {
      email,
      username,
      displayName: username,
      role: "user",
      level: 1,
      totalTrades: 0,
      walletBalance: 0,
      rating: 0,
      reviewCount: 0,
      badges: [],
      joinDate: new Date(),
      isVerified: false,
      isBanned: false
    };

    // Save user data using firebase-api service
    const { createUser } = await import('../services/firebase-api');
    await createUser(result.user.uid, userData);

    return result.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const loginWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw new Error(error.message);
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      // Check if user profile exists, create if not
      const userRef = ref(database, `users/${result.user.uid}`);
      const userSnapshot = await get(userRef);
      
      if (!userSnapshot.exists()) {
        const username = result.user.email?.split('@')[0] || `user_${Date.now()}`;
        
        const userData: InsertUser = {
          email: result.user.email!,
          username,
          displayName: result.user.displayName || username,
          photoURL: result.user.photoURL || undefined,
          role: "user",
          level: 1,
          totalTrades: 0,
          walletBalance: 0,
          rating: 0,
          reviewCount: 0,
          badges: [],
          joinDate: new Date(),
          isVerified: true, // Google accounts are pre-verified
          isBanned: false
        };

        const { createUser } = await import('../services/firebase-api');
        await createUser(result.user.uid, userData);
      }
      
      return result.user;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getUserProfile = async (uid: string): Promise<AppUser | null> => {
  try {
    const { getUser } = await import('../services/firebase-api');
    return await getUser(uid);
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const updateUserLevel = async (uid: string, totalTrades: number) => {
  let level = 1;
  
  // Level calculation: Level 2 = 500 trades, Level 3 = 1000, Level 4 = 1500, etc.
  if (totalTrades >= 500) {
    level = Math.floor((totalTrades - 500) / 500) + 2;
  }
  
  const userRef = ref(database, `users/${uid}`);
  await set(ref(database, `users/${uid}/level`), level);
  await set(ref(database, `users/${uid}/totalTrades`), totalTrades);
};
