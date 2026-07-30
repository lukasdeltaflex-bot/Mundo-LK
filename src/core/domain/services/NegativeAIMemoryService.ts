import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface NegativeAIMemoryDoc {
  id: string;
  marketplaceId: string;
  produtoCategoria: string;
  estiloCopy: string;
  avoidPattern: string;
  userCorrection: string;
  createdAt: string;
}

export class NegativeAIMemoryService {
  private static cache = new Map<string, { rules: string[]; timestamp: number }>();
  private static CACHE_TTL_MS = 10 * 60 * 1000;

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

  public static async getNegativeRules(marketplaceId: string, categoria: string): Promise<string[]> {
    const key = `${marketplaceId.toLowerCase()}_${categoria.toLowerCase()}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.rules;
    }

    const rules: string[] = [];

    try {
      const q = query(
        collection(this.db, 'ai_memory_marketplaces_negative'),
        where('marketplaceId', '==', marketplaceId.toLowerCase())
      );
      const snap = await getDocs(q);
      snap.forEach((d) => {
        const data = d.data() as NegativeAIMemoryDoc;
        if (data.avoidPattern) {
          rules.push(`PROIBIDO: ${data.avoidPattern} (Motivo: Correção prévia do usuário em ${data.produtoCategoria})`);
        }
      });
    } catch (err) {
      console.warn('[NegativeAIMemoryService] Aviso ao carregar memória negativa:', err);
    }

    // Regras padrão estáticas de segurança
    if (marketplaceId.toLowerCase() === 'shopee' && (categoria.toLowerCase().includes('luxo') || categoria.toLowerCase().includes('perfumaria'))) {
      rules.push('PROIBIDO: Mencionar "Achadinho" ou "Shopee" no título de produtos de perfumaria fina/luxo.');
    }

    this.cache.set(key, { rules, timestamp: Date.now() });
    return rules;
  }

  public static async recordNegativeMemory(docData: Omit<NegativeAIMemoryDoc, 'id' | 'createdAt'>): Promise<void> {
    try {
      const docId = `neg_${docData.marketplaceId.toLowerCase()}_${Date.now()}`;
      const docRef = doc(this.db, 'ai_memory_marketplaces_negative', docId);
      await setDoc(docRef, {
        ...docData,
        id: docId,
        createdAt: new Date().toISOString(),
      });
      console.log('[NegativeAIMemoryService] Memória negativa salva com sucesso:', docData.avoidPattern);
    } catch (err) {
      console.warn('[NegativeAIMemoryService] Erro ao salvar memória negativa:', err);
    }
  }
}
