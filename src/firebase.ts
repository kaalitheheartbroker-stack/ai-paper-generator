import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA4--6Pu-uMDBxcZQAWmPX0lEHpTwMqU4E",
  authDomain: "preexamwale.firebaseapp.com",
  projectId: "preexamwale",
  storageBucket: "preexamwale.firebasestorage.app",
  messagingSenderId: "826894078147",
  appId: "1:826894078147:web:9e9310404af5766f8d1276",
  measurementId: "G-TTLWVJQE0H"
};

const app = initializeApp(firebaseConfig);

// Modern Firestore Cache initialization (prevents deprecation warning)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);