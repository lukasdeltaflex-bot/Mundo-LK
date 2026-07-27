import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config/firebase.config';

export interface AnalyticsMetric {
  sessionId: string;
  requestId: string;
  url: string;
  expandedUrl?: string;
  marketplace: string;
  providerUsed: string;
  confidenceScore: number;
  productFound: boolean;
  cacheHit: boolean;
  cacheTier?: string;
  scrapingDurationMs: number;
  aiDurationMs?: number;
  totalDurationMs: number;
  failureReason?: string;
  timestamp: string;
}

export class AnalyticsLogger {
  private static instance: AnalyticsLogger;

  private constructor() {}

  public static getInstance(): AnalyticsLogger {
    if (!AnalyticsLogger.instance) {
      AnalyticsLogger.instance = new AnalyticsLogger();
    }
    return AnalyticsLogger.instance;
  }

  public async logMetric(metric: AnalyticsMetric): Promise<void> {
    try {
      console.log(`[Analytics] 📊 Telemetria registrada: ${metric.marketplace} | ${metric.providerUsed} | Score: ${metric.confidenceScore}% | ${metric.totalDurationMs}ms`);
      await addDoc(collection(db, 'analytics'), {
        ...metric,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`[Analytics] Falha ao registrar telemetria no Firestore:`, err);
    }
  }
}
