import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "monlyking.firebaseapp.com",
  databaseURL: "https://monlyking-default-rtdb.firebaseio.com",
  projectId: "monlyking",
  storageBucket: "monlyking.firebasestorage.app",
  appId: "1:1069894505862:web:3cdd8449baf1e6b93f8807",
  messagingSenderId: "1069894505862"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
