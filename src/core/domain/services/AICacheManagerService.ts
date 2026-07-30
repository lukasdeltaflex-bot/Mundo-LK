import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { GeminiOfferAnalysis } from '@/infrastructure/ai/providers/gemini.adapter';

export class AICacheManagerService {
  private static memoryCache = new Map<string, { data: GeminiOfferAnalysis; timestamp: number }>();
  private static CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Horas

  private static db = (() => {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    return getFirestore(app);
  })();

  public static generateCacheKey(productId: string, style: string, goal: string, mode: string): string {
    return `cache_${productId.toLowerCase()}_${style}_${goal}_${mode}`;
  }

  public static async getCachedAnalysis(cacheKey: string): Promise<GeminiOfferAnalysis | null> {
    // 1. L1 Memory Cache Check (<1ms)
    const memHit = this.memoryCache.get(cacheKey);
    if (memHit && Date.now() - memHit.timestamp < this.CACHE_TTL_MS) {
      console.log(`[AICacheManagerService] ⚡ Hit L1 Memory Cache para ${cacheKey}`);
      return memHit.data;
    }

    // 2. L2 Firestore Cache Check (<100ms)
    try {
      const docRef = doc(this.db, 'ai_cache_analysis', cacheKey);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as { analysis: GeminiOfferAnalysis; timestamp: number };
        if (Date.now() - data.timestamp < this.CACHE_TTL_MS) {
          console.log(`[AICacheManagerService] 💾 Hit L2 Firestore Cache para ${cacheKey}`);
          this.memoryCache.set(cacheKey, { data: data.analysis, timestamp: data.timestamp });
          return data.analysis;
        }
      }
    } catch (err) {
      console.warn('[AICacheManagerService] Falha ao consultar L2 Cache:', err);
    }

    return null;
  }

  public static async saveCachedAnalysis(cacheKey: string, analysis: GeminiOfferAnalysis): Promise<void> {
    const timestamp = Date.now();
    this.memoryCache.set(cacheKey, { data: analysis, timestamp });

    try {
      const docRef = doc(this.db, 'ai_cache_analysis', cacheKey);
      await setDoc(docRef, { analysis, timestamp }, { merge: true });
    } catch (err) {
      console.warn('[AICacheManagerService] Falha ao salvar L2 Cache:', err);
    }
  }
}
