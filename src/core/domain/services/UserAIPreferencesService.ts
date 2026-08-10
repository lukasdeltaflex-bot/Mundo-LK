import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

export interface UserTextEditEvent {
  id?: string;
  userId: string;
  originalText: string;
  editedText: string;
  addedTerms: string[];
  removedTerms: string[];
  lengthBefore: number;
  lengthAfter: number;
  emojiDensityBefore: 'baixa' | 'media' | 'alta';
  emojiDensityAfter: 'baixa' | 'media' | 'alta';
  timestamp: string;
  source: 'MANUAL_USER_EDIT';
}

export interface UserAIPreferences {
  userId: string;
  strategyVersion: number;
  confidenceScore: number;
  updatedAt: string;
  preferEmojiDensity: 'baixa' | 'media' | 'alta';
  preferLength: 'conciso' | 'medio' | 'detalhado';
  avoidCliches: boolean;
  tonePreference: 'direto' | 'emocional' | 'tecnico';
  customKeywords: string[];
  learnedAvoidTerms?: string[];
}

export class UserAIPreferencesService {
  private static cache = new Map<string, { data: UserAIPreferences; timestamp: number }>();
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

  public static async getUserPreferences(userId: string): Promise<UserAIPreferences | null> {
    if (!userId || userId === 'guest') return null;

    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const docRef = doc(this.db, 'user_ai_preferences', userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as UserAIPreferences;
        this.cache.set(userId, { data, timestamp: Date.now() });
        return data;
      }
    } catch (err) {
      console.warn('[UserAIPreferencesService] Falha ao ler preferências do usuário:', err);
    }
    return null;
  }

  /**
   * Extrai palavras relevantes (comprimento > 3, ignorando stop-words comuns)
   */
  private static extractRelevantTerms(text: string): string[] {
    const stopWords = new Set([
      'este', 'esta', 'para', 'com', 'mais', 'como', 'pela', 'pelo', 'onde',
      'tudo', 'voce', 'você', 'sobre', 'está', 'estao', 'estão', 'muito', 'essa',
      'esse', 'qual', 'quais', 'seus', 'suas', 'cada', 'tudo', 'aqui', 'apenas'
    ]);

    const clean = text
      .toLowerCase()
      .replace(/[^\w\s\u00C0-\u00FF]/g, ' ')
      .replace(/\s+/g, ' ');

    return Array.from(new Set(
      clean.split(' ')
        .map((w) => w.trim())
        .filter((w) => w.length > 3 && !stopWords.has(w))
    ));
  }

  public static async recordUserEdit(
    userId: string,
    originalCopy: string,
    editedCopy: string,
    marketplaceSlug = 'geral',
    categoryId = 'geral'
  ): Promise<UserTextEditEvent | null> {
    if (!userId || userId === 'guest' || !editedCopy || originalCopy === editedCopy) return null;

    try {
      const existing = (await this.getUserPreferences(userId)) || {
        userId,
        strategyVersion: 1,
        confidenceScore: 60,
        updatedAt: new Date().toISOString(),
        preferEmojiDensity: 'media',
        preferLength: 'medio',
        avoidCliches: true,
        tonePreference: 'direto',
        customKeywords: [],
        learnedAvoidTerms: [],
      };

      // 1. Densidade de Emojis Antes vs Depois
      const countEmojis = (str: string) => (str.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
      const getEmojiDensity = (c: number): 'baixa' | 'media' | 'alta' => (c > 5 ? 'alta' : c > 2 ? 'media' : 'baixa');

      const emojiBefore = getEmojiDensity(countEmojis(originalCopy));
      const emojiAfter = getEmojiDensity(countEmojis(editedCopy));

      // 2. Comprimento
      const lengthPref = editedCopy.length < 150 ? 'conciso' : editedCopy.length > 500 ? 'detalhado' : 'medio';

      // 3. Extração de Termos Adicionados e Removidos (Diff Real)
      const origTerms = this.extractRelevantTerms(originalCopy);
      const editTerms = this.extractRelevantTerms(editedCopy);

      const addedTerms = editTerms.filter((t) => !origTerms.includes(t));
      const removedTerms = origTerms.filter((t) => !editTerms.includes(t));

      const event: UserTextEditEvent = {
        id: `edit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        originalText: originalCopy,
        editedText: editedCopy,
        addedTerms,
        removedTerms,
        lengthBefore: originalCopy.length,
        lengthAfter: editedCopy.length,
        emojiDensityBefore: emojiBefore,
        emojiDensityAfter: emojiAfter,
        timestamp: new Date().toISOString(),
        source: 'MANUAL_USER_EDIT',
      };

      // Persiste o evento individual no Firestore para auditoria
      const eventDocRef = doc(this.db, 'user_text_edit_events', event.id!);
      await setDoc(eventDocRef, event);

      // Regra da Fase 4 (BUG-AI-001): O evento é sempre registrado, mas a promoção de termos
      // para o perfil consolidado (customKeywords e learnedAvoidTerms) só ocorre quando o score
      // de confiança consolidado for >= 70%, evitando overfitting por edições isoladas.
      const newConfidence = Math.min(100, existing.confidenceScore + 5);
      const isConsolidatedThreshold = newConfidence >= 70;

      const updatedKeywords = isConsolidatedThreshold
        ? Array.from(new Set([...(existing.customKeywords || []), ...addedTerms])).slice(0, 15)
        : (existing.customKeywords || []);

      const updatedAvoidTerms = isConsolidatedThreshold
        ? Array.from(new Set([...(existing.learnedAvoidTerms || []), ...removedTerms])).slice(0, 15)
        : (existing.learnedAvoidTerms || []);

      const updated: UserAIPreferences = {
        ...existing,
        confidenceScore: newConfidence,
        preferEmojiDensity: emojiAfter,
        preferLength: lengthPref,
        customKeywords: updatedKeywords,
        learnedAvoidTerms: updatedAvoidTerms,
        updatedAt: new Date().toISOString(),
      };

      const userDocRef = doc(this.db, 'user_ai_preferences', userId);
      await setDoc(userDocRef, updated, { merge: true });
      this.cache.set(userId, { data: updated, timestamp: Date.now() });

      console.log(`[UserAIPreferencesService] 👤 Evento de edição registrado para ${userId}. Adicionados: [${addedTerms.join(', ')}], Removidos: [${removedTerms.join(', ')}]`);

      return event;
    } catch (err) {
      console.warn('[UserAIPreferencesService] Falha ao registrar edição do usuário:', err);
      return null;
    }
  }

  public static formatPreferencesPrompt(prefs: UserAIPreferences | null): string {
    if (!prefs) return '';
    const keywordsStr = prefs.customKeywords && prefs.customKeywords.length > 0 ? `\n- Vocabulário/Termos preferidos pelo usuário: ${prefs.customKeywords.join(', ')}` : '';
    const avoidStr = prefs.learnedAvoidTerms && prefs.learnedAvoidTerms.length > 0 ? `\n- Evitar termos frequentemente removidos: ${prefs.learnedAvoidTerms.join(', ')}` : '';

    return `👤 PREFERÊNCIAS HISTÓRICAS DO USUÁRIO (Confiança: ${prefs.confidenceScore}%):
- Densidade de Emojis desejada: ${prefs.preferEmojiDensity.toUpperCase()}
- Extensão de texto preferida: ${prefs.preferLength.toUpperCase()}
- Tom de comunicação preferido: ${prefs.tonePreference.toUpperCase()}
- Evitar clichês genéricos: SIM${keywordsStr}${avoidStr}`;
  }
}
