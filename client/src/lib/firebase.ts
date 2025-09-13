import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Check if environment variables are available
const getEnvVar = (key: string, fallback: string) => {
  const value = import.meta.env[key];
  if (!value) {
    console.warn(`⚠️ Environment variable ${key} not found. Using fallback value.`);
    console.warn('🔐 For security, create a .env.local file with your Firebase config.');
  }
  return value || fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', 'AIzaSyAUbaa0W8FFVX-VbFcFsEe0DthW8FEWKiI'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'monlyking2.firebaseapp.com'),
  databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL', 'https://monlyking2-default-rtdb.firebaseio.com'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', 'monlyking2'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'monlyking2.firebasestorage.app'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', '437375224153'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', '1:437375224153:web:6081589793065684082448')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  client_id: getEnvVar('VITE_GOOGLE_CLIENT_ID', '437375224153-fb9qaraofmij9aju0lapo72g9ektll90.apps.googleusercontent.com')
});

export default app;
