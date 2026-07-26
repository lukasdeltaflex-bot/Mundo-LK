import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config/firebase.config';
import { AIMemory } from '../../../core/domain/entities/ai-memory.entity';

export class AIMemoryService {
  private static instance: AIMemoryService;
  private collectionName = 'ai_memory';
  private memoryStore: Map<string, AIMemory> = new Map();

  public static getInstance(): AIMemoryService {
    if (!AIMemoryService.instance) {
      AIMemoryService.instance = new AIMemoryService();
    }
    return AIMemoryService.instance;
  }

  public async getMemoryForUser(userId: string = 'default_admin_user'): Promise<AIMemory> {
    try {
      const ref = doc(db, this.collectionName, userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        return new AIMemory({
          userId: d.userId,
          preferredStyle: d.preferredStyle,
          copiedCTAs: d.copiedCTAs,
          bannedWords: d.bannedWords,
          preferredWords: d.preferredWords,
          favoriteCategories: d.favoriteCategories,
          favoriteMarketplaces: d.favoriteMarketplaces,
          favoriteHashtags: d.favoriteHashtags,
          avgTextLength: d.avgTextLength,
          activeHours: d.activeHours,
          favoriteChannels: d.favoriteChannels,
          updatedAt: new Date(d.updatedAt),
        });
      }
    } catch {
      const mem = this.memoryStore.get(userId);
      if (mem) return mem;
    }

    const defaultMemory = new AIMemory({ userId });
    this.memoryStore.set(userId, defaultMemory);
    return defaultMemory;
  }

  public async saveMemory(memory: AIMemory): Promise<void> {
    this.memoryStore.set(memory.userId, memory);
    try {
      const ref = doc(db, this.collectionName, memory.userId);
      await setDoc(
        ref,
        {
          userId: memory.userId,
          preferredStyle: memory.preferredStyle,
          copiedCTAs: memory.copiedCTAs,
          bannedWords: memory.bannedWords,
          preferredWords: memory.preferredWords,
          favoriteCategories: memory.favoriteCategories,
          favoriteMarketplaces: memory.favoriteMarketplaces,
          favoriteHashtags: memory.favoriteHashtags,
          avgTextLength: memory.avgTextLength,
          activeHours: memory.activeHours,
          favoriteChannels: memory.favoriteChannels,
          updatedAt: memory.updatedAt.toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('[AIMemoryService] Memory persisted locally:', error);
    }
  }
}
