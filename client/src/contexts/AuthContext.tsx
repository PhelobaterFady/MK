import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from '../lib/firebase';
import { getUserProfile } from '../lib/auth';
import { User as AppUser } from '@shared/schema';
import { ref, onValue, off, get } from 'firebase/database';
import { initializeUserLevelSystem } from '../utils/userInitializer';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  resetPassword: async () => {}
});

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let userProfileUnsubscribe: (() => void) | undefined;
    
    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        
        if (user) {
          try {
            // Listen for real-time updates to user profile
            const userRef = ref(database, `users/${user.uid}`);
            userProfileUnsubscribe = onValue(userRef, (snapshot) => {
              if (snapshot.exists()) {
                const updatedProfile = snapshot.val();
                console.log('User profile updated:', updatedProfile);
                
                // Check if user is disabled
                if (updatedProfile.isDisabled) {
                  console.log('User account is disabled, signing out...');
                  logout();
                  return;
                }
                
                setUserProfile(updatedProfile);
                
                // Initialize level system if needed
                if (!updatedProfile.accountLevel || !updatedProfile.totalTransactionValue) {
                  initializeUserLevelSystem(user.uid).catch(error => 
                    console.error('Error initializing user level system:', error)
                  );
                }
              } else {
                // If user profile doesn't exist, try to get it from auth
                getUserProfile(user.uid).then(profile => {
                  setUserProfile(profile);
                }).catch(error => {
                  console.error('Error loading user profile:', error);
                  setUserProfile(null);
                });
              }
            });
          } catch (error) {
            console.error('Error setting up user profile listener:', error);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
          if (userProfileUnsubscribe) {
            userProfileUnsubscribe();
            userProfileUnsubscribe = undefined;
          }
        }
        
        setLoading(false);
      });
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (userProfileUnsubscribe) {
        userProfileUnsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { loginWithEmail } = await import('../lib/auth');
      const user = await loginWithEmail(email, password);
      
      // Check if user is disabled after successful login
      if (user) {
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          if (userData.isDisabled) {
            await logout();
            throw new Error('Your account has been disabled. Please contact support.');
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      const { registerWithEmail } = await import('../lib/auth');
      await registerWithEmail(email, password, username);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { loginWithGoogle: googleLogin } = await import('../lib/auth');
      const user = await googleLogin();
      
      // Check if user is disabled after successful login
      if (user) {
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          if (userData.isDisabled) {
            await logout();
            throw new Error('Your account has been disabled. Please contact support.');
          }
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { logout: authLogout } = await import('../lib/auth');
      await authLogout();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { resetPassword: authResetPassword } = await import('../lib/auth');
      await authResetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}