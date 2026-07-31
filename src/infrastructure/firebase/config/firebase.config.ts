import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Configuração oficial estrita do projeto Firebase "mundo-lk-eb4da"
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCSD70V0UfbwRlpCitCwMOWGpTZmPg5HmQ',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mundo-lk-eb4da.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mundo-lk-eb4da',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mundo-lk-eb4da.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '90164257983',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:90164257983:web:b98e8dfd2816ebb9a1920a',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-HGV68PG5XR',
};

// Singleton Firebase Client Application
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);


