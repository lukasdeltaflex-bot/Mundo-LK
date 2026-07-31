import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import {
  getAuth,
  initializeAuth,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  Auth,
} from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Configuração oficial estrita do projeto Firebase "mundo-lk-eb4da"
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCSD70V0UfbwRlpCitCwMOWGpTZmPg5HmQ',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (typeof window !== 'undefined' ? window.location.host : 'mundo-lk.vercel.app'),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mundo-lk-eb4da',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mundo-lk-eb4da.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '90164257983',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:90164257983:web:b98e8dfd2816ebb9a1920a',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-HGV68PG5XR',
};

// Singleton Firebase Client Application
const initTime = new Date().toISOString();
console.log(`[AUTH TELEMETRY] initializeApp (${initTime})`);
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);

// Inicialização resiliente para Safari iOS (IndexedDB -> localStorage -> inMemory)
export const auth: Auth = (() => {
  if (typeof window !== 'undefined') {
    try {
      console.log('[AUTH TELEMETRY] Configurando initializeAuth com resiliência para Safari iOS');
      return initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
      });
    } catch {
      return getAuth(app);
    }
  }
  return getAuth(app);
})();

export const storage: FirebaseStorage = getStorage(app);

// ── TELEMETRIA DE PERSISTÊNCIA EM RUNTIME ──────────────────────────────────
if (typeof window !== 'undefined') {
  const startTime = new Date().toISOString();
  console.log(`[AUTH TELEMETRY] setPersistence INICIADO: ${startTime}`);
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      const endTime = new Date().toISOString();
      console.log(`[AUTH TELEMETRY] setPersistence RESOLVIDO: ${endTime}`);
    })
    .catch((err: any) => {
      console.warn(`[AUTH TELEMETRY] setPersistence ERRO (${new Date().toISOString()}):`, err);
    });
}

