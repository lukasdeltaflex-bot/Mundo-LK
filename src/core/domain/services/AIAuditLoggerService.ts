import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, query, limit, getDocs } from 'firebase/firestore';

export interface AILogEntry {
  id: string;
  timestamp: string;
  userId: string;
  productTitle: string;
  marketplace: string;
  style: string;
  goal: string;
  mode: string;
  modelUsed: string;
  temperature: number;
  durationMs: number;
  tokensConsumed: number;
  autoRating: number;
  success: boolean;
  errorMessage?: string;
  cacheHit?: boolean;
}

export interface AIAuditMetrics {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  cacheHits: number;
  avgDurationMs: number;
  totalTokens: number;
  savedTokensByCache: number;
}

export class AIAuditLoggerService {
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

  public static async logExecution(entry: Omit<AILogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(this.db, 'ai_generation_logs', id);

      const payload: AILogEntry = {
        ...entry,
        id,
        timestamp: new Date().toISOString(),
      };

      await setDoc(docRef, payload, { merge: true });
      console.log(`[AIAuditLoggerService] 📊 Log de execução registrado (${payload.durationMs}ms, ${payload.tokensConsumed} tokens):`, id);
    } catch (err) {
      console.warn('[AIAuditLoggerService] Falha ao registrar log de execução:', err);
    }
  }

  public static async getMetricsSummary(): Promise<AIAuditMetrics> {
    try {
      const colRef = collection(this.db, 'ai_generation_logs');
      const q = query(colRef, limit(100));
      const snap = await getDocs(q);

      let totalCalls = 0;
      let successCount = 0;
      let errorCount = 0;
      let cacheHits = 0;
      let totalDurationMs = 0;
      let totalTokens = 0;

      snap.forEach((docSnap) => {
        const data = docSnap.data() as AILogEntry;
        totalCalls++;
        if (data.success) successCount++;
        else errorCount++;

        if (data.cacheHit) cacheHits++;
        totalDurationMs += data.durationMs || 0;
        totalTokens += data.tokensConsumed || 0;
      });

      const avgDurationMs = totalCalls > 0 ? Math.round(totalDurationMs / totalCalls) : 0;
      const savedTokensByCache = cacheHits * 450; // Média estimada por chamada

      return {
        totalCalls,
        successCount,
        errorCount,
        cacheHits,
        avgDurationMs,
        totalTokens,
        savedTokensByCache,
      };
    } catch {
      return {
        totalCalls: 0,
        successCount: 0,
        errorCount: 0,
        cacheHits: 0,
        avgDurationMs: 0,
        totalTokens: 0,
        savedTokensByCache: 0,
      };
    }
  }
}
