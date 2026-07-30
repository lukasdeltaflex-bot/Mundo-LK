import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export interface CategoryAIMemory {
  categoryId: string;
  strategyVersion: number;
  confidenceScore: number;
  updatedAt: string;
  keyVocabulary: string[];
  primaryPainPoint: string;
  conversionTriggers: string[];
}

export class CategoryAIMemoryService {
  private static cache = new Map<string, { data: CategoryAIMemory; timestamp: number }>();
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

  public static async getCategoryMemory(categoryId: string): Promise<CategoryAIMemory> {
    const normalizedId = categoryId.toLowerCase();
    const cached = this.cache.get(normalizedId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const docRef = doc(this.db, 'ai_memory_categories', normalizedId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as CategoryAIMemory;
        this.cache.set(normalizedId, { data, timestamp: Date.now() });
        return data;
      }
    } catch (err) {
      console.warn(`[CategoryAIMemoryService] Falha ao ler memória da categoria ${categoryId}:`, err);
    }

    const defaultMemory: CategoryAIMemory = {
      categoryId,
      strategyVersion: 1,
      confidenceScore: 85,
      updatedAt: new Date().toISOString(),
      keyVocabulary: ['Qualidade', 'Durabilidade', 'Custo-Benefício', 'Desconto'],
      primaryPainPoint: 'Garantir produto autêntico pelo menor preço',
      conversionTriggers: ['Desconto Percentual Real', 'Praticidade no Dia a Dia'],
    };

    this.cache.set(normalizedId, { data: defaultMemory, timestamp: Date.now() });
    return defaultMemory;
  }

  public static formatCategoryPrompt(mem: CategoryAIMemory): string {
    return `🏷️ MEMÓRIA ESPECÍFICA DA CATEGORIA (${mem.categoryId.toUpperCase()}) (Confiança: ${mem.confidenceScore}%):
- Vocabulário Chave Aprendido: ${mem.keyVocabulary.join(', ')}
- Dor Principal Solucionada: "${mem.primaryPainPoint}"
- Gatilhos de Alta Conversão: ${mem.conversionTriggers.join(', ')}`;
  }
}
