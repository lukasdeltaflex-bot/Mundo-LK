import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

export interface MarketplaceAIMemory {
  marketplaceSlug: string;
  strategyVersion: number;
  confidenceScore: number;
  updatedAt: string;
  copyLengthStyle: 'curto' | 'medio' | 'extenso';
  emojiUsage: 'abundante' | 'moderado' | 'discreto';
  urgencyLevel: 'alta' | 'media' | 'baixa';
  focusPillars: string[];
}

export class MarketplaceAIMemoryService {
  private static cache = new Map<string, { data: MarketplaceAIMemory; timestamp: number }>();
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

  public static async getMarketplaceMemory(slug: string): Promise<MarketplaceAIMemory> {
    const normalizedSlug = slug.toLowerCase();
    const cached = this.cache.get(normalizedSlug);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const docRef = doc(this.db, 'ai_memory_marketplaces', normalizedSlug);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as MarketplaceAIMemory;
        this.cache.set(normalizedSlug, { data, timestamp: Date.now() });
        return data;
      }
    } catch (err) {
      console.warn(`[MarketplaceAIMemoryService] Falha ao ler memória de ${slug}:`, err);
    }

    // Default estático refinado por canal
    const defaults: Record<string, MarketplaceAIMemory> = {
      shopee: {
        marketplaceSlug: 'shopee',
        strategyVersion: 1,
        confidenceScore: 95,
        updatedAt: new Date().toISOString(),
        copyLengthStyle: 'curto',
        emojiUsage: 'abundante',
        urgencyLevel: 'alta',
        focusPillars: ['Preço Baixo Imediato', 'Cupom de Frete Grátis', 'Achadinho Útil'],
      },
      mercadolivre: {
        marketplaceSlug: 'mercadolivre',
        strategyVersion: 1,
        confidenceScore: 95,
        updatedAt: new Date().toISOString(),
        copyLengthStyle: 'medio',
        emojiUsage: 'discreto',
        urgencyLevel: 'media',
        focusPillars: ['Envio Rápido Full/Flex', 'Garantia Oficial do Vendedor', 'Segurança na Compra'],
      },
    };

    const result = defaults[normalizedSlug] || {
      marketplaceSlug: normalizedSlug,
      strategyVersion: 1,
      confidenceScore: 80,
      updatedAt: new Date().toISOString(),
      copyLengthStyle: 'medio',
      emojiUsage: 'moderado',
      urgencyLevel: 'media',
      focusPillars: ['Custo-Benefício', 'Qualidade Comprovada'],
    };

    this.cache.set(normalizedSlug, { data: result, timestamp: Date.now() });
    return result;
  }

  public static formatMarketplacePrompt(mem: MarketplaceAIMemory): string {
    return `🏪 MEMÓRIA ESPECÍFICA DO MARKETPLACE (${mem.marketplaceSlug.toUpperCase()}) (Confiança: ${mem.confidenceScore}%):
- Estilo de Extensão: ${mem.copyLengthStyle.toUpperCase()}
- Uso de Emojis: ${mem.emojiUsage.toUpperCase()}
- Nível de Urgência: ${mem.urgencyLevel.toUpperCase()}
- Pilares de Foco Obrigatórios: ${mem.focusPillars.join(', ')}`;
  }
}
