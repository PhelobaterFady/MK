import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAUbaa0W8FFVX-VbFcFsEe0DthW8FEWKiI",
  authDomain: "monlyking2.firebaseapp.com",
  databaseURL: "https://monlyking2-default-rtdb.firebaseio.com",
  projectId: "monlyking2",
  storageBucket: "monlyking2.firebasestorage.app",
  messagingSenderId: "437375224153",
  appId: "1:437375224153:web:6081589793065684082448"
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
  client_id: '437375224153-fb9qaraofmij9aju0lapo72g9ektll90.apps.googleusercontent.com'
});

export default app;
