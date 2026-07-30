import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';

export interface WinningStrategy {
  id: string;
  strategyVersion: number;
  category: string;
  marketplace: string;
  style: string;
  goal: string;
  winningAngle: string;
  winningCTA: string;
  
  // Independent Metrics
  clickCount: number;
  conversionCount: number;
  ctrPercent: number;
  conversionRatePercent: number;
  averageTicketBRL: number;
  commissionEarnedBRL: number;
  roiPercent: number;

  confidenceScore: number;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export class WinningStrategyService {
  private static cache = new Map<string, { data: WinningStrategy[]; timestamp: number }>();
  private static CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos L1 Cache

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

  /**
   * Calculates time decay multiplier (half-life of 90 days)
   */
  private static calculateTimeDecay(createdAtISO: string): number {
    const days = (Date.now() - new Date(createdAtISO).getTime()) / (1000 * 60 * 60 * 24);
    return Math.exp(-0.0077 * Math.max(0, days)); // ~50% peso após 90 dias
  }

  /**
   * Persists real performance data with minimum sample guardrails (≥100 clicks or ≥5 conversions)
   */
  public static async recordPerformance(data: {
    category: string;
    marketplace: string;
    style: string;
    goal: string;
    winningAngle: string;
    winningCTA: string;
    clicks: number;
    conversions: number;
    ticketAmountBRL?: number;
    commissionAmountBRL?: number;
  }): Promise<void> {
    try {
      // Guardrail de aprendizado mínimo
      if (data.clicks < 100 && data.conversions < 5) {
        console.log(`[WinningStrategyService] ⏳ Amostragem insuficiente (${data.clicks} cliques / ${data.conversions} vendas). Mínimo de 100 cliques ou 5 vendas para registrar estratégia vencedora.`);
        return;
      }

      const strategyId = `win_${data.category.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${data.style}`;
      const docRef = doc(this.db, 'winning_strategies', strategyId);

      const ctrPercent = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;
      const conversionRatePercent = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;
      const confidenceScore = Math.min(100, Math.round((data.clicks / 500) * 100));

      const payload: WinningStrategy = {
        id: strategyId,
        strategyVersion: 1,
        category: data.category,
        marketplace: data.marketplace,
        style: data.style,
        goal: data.goal,
        winningAngle: data.winningAngle,
        winningCTA: data.winningCTA,

        clickCount: data.clicks,
        conversionCount: data.conversions,
        ctrPercent,
        conversionRatePercent,
        averageTicketBRL: data.ticketAmountBRL || 150,
        commissionEarnedBRL: data.commissionAmountBRL || 30,
        roiPercent: conversionRatePercent * 10,

        confidenceScore,
        score: Math.round(data.conversions * 10 + data.clicks),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, payload, { merge: true });
      this.cache.delete(data.category);
      console.log(`[WinningStrategyService] 🏆 Estratégia vencedora persistida (Confiança ${confidenceScore}%):`, strategyId);
    } catch (err) {
      console.warn('[WinningStrategyService] Falha silenciosa ao salvar estratégia vencedora:', err);
    }
  }

  /**
   * Retrieves top winning strategies with Time Decay and Confidence Filtering for Gemini prompt
   */
  public static async getTopStrategiesContext(category: string): Promise<string> {
    try {
      const cached = this.cache.get(category);
      let items: WinningStrategy[] = [];

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        items = cached.data;
      } else {
        const colRef = collection(this.db, 'winning_strategies');
        const q = query(colRef, where('category', '==', category), limit(5));
        const snap = await getDocs(q);

        snap.forEach((docSnap) => {
          items.push(docSnap.data() as WinningStrategy);
        });

        this.cache.set(category, { data: items, timestamp: Date.now() });
      }

      if (items.length === 0) return '';

      // Aplica Time Decay e ordena por pontuação ponderada
      const weighted = items
        .map((it) => {
          const decay = this.calculateTimeDecay(it.createdAt);
          const finalScore = it.score * decay * (it.confidenceScore / 100);
          return { ...it, finalScore, decay };
        })
        .sort((a, b) => b.finalScore - a.finalScore);

      const top = weighted[0];
      if (!top) return '';

      return `🏆 ESTRATÉGIA VENDEDORA HISTÓRICA COMPROVADA (Confiança: ${top.confidenceScore}%, Taxa de Conversão: ${top.conversionRatePercent.toFixed(1)}%):
"Encontrei uma estratégia anterior com ${top.conversionRatePercent.toFixed(1)}% de conversão (${top.conversionCount} vendas em ${top.clickCount} cliques) para a categoria ${top.category}. Padrão de escrita: Ângulo: '${top.winningAngle}' | CTA: '${top.winningCTA}'."`;
    } catch {
      return '';
    }
  }
}
