import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

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

    // L1 Cache Check
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

  public static async recordUserEdit(userId: string, originalCopy: string, editedCopy: string): Promise<void> {
    if (!userId || userId === 'guest' || !editedCopy || originalCopy === editedCopy) return;

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
      };

      // Análise da densidade de emojis no texto editado
      const emojiCount = (editedCopy.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
      const emojiDensity = emojiCount > 5 ? 'alta' : emojiCount > 2 ? 'media' : 'baixa';

      // Análise de tamanho
      const lengthPref = editedCopy.length < 150 ? 'conciso' : editedCopy.length > 500 ? 'detalhado' : 'medio';

      const updated: UserAIPreferences = {
        ...existing,
        confidenceScore: Math.min(100, existing.confidenceScore + 5),
        preferEmojiDensity: emojiDensity,
        preferLength: lengthPref,
        updatedAt: new Date().toISOString(),
      };

      const docRef = doc(this.db, 'user_ai_preferences', userId);
      await setDoc(docRef, updated, { merge: true });
      this.cache.set(userId, { data: updated, timestamp: Date.now() });
      console.log(`[UserAIPreferencesService] 👤 Preferências do usuário ${userId} atualizadas com sucesso.`);
    } catch (err) {
      console.warn('[UserAIPreferencesService] Falha ao registrar edição do usuário:', err);
    }
  }

  public static formatPreferencesPrompt(prefs: UserAIPreferences | null): string {
    if (!prefs) return '';
    return `👤 PREFERÊNCIAS HISTÓRICAS DO USUÁRIO (Confiança: ${prefs.confidenceScore}%):
- Densidade de Emojis desejada: ${prefs.preferEmojiDensity.toUpperCase()}
- Extensão de texto preferida: ${prefs.preferLength.toUpperCase()}
- Tom de comunicação preferido: ${prefs.tonePreference.toUpperCase()}
- Evitar clichês genéricos: SIM`;
  }
}
