import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase.config';
import { ICategoryPreferenceRepository } from '../../../core/domain/ports/repositories/ICategoryPreferenceRepository';
import { CategoryPreference, CategoryPreferenceProps } from '../../../core/domain/entities/category-preference.entity';

export interface FirestoreCategoryPreferenceDoc {
  id: string;
  userId: string;
  tenantId?: string;
  keywordPattern: string;
  targetCategoryId: string;
  targetCategoryName: string;
  targetSubcategoryId: string | null;
  targetSubcategoryName: string | null;
  correctionCount: number;
  lastUsedAt: string;
  createdAt: string;
}

export class FirestoreCategoryPreferenceRepository implements ICategoryPreferenceRepository {
  private collectionName = 'user_category_preferences';

  public async findByUserId(userId: string): Promise<CategoryPreference[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        limit(100)
      );
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => this.toDomain(docSnap.data() as FirestoreCategoryPreferenceDoc));
    } catch (err) {
      console.warn('[FirestoreCategoryPreferenceRepository] findByUserId error:', err);
      return [];
    }
  }

  public async findMatching(userId: string, text: string): Promise<CategoryPreference | null> {
    if (!text || text.trim().length === 0) return null;
    const preferences = await this.findByUserId(userId);
    const textLower = text.toLowerCase();

    // Exact or keyword inclusion match with highest correction count
    const matches = preferences
      .filter((pref) => pref.keywordPattern.length > 2 && textLower.includes(pref.keywordPattern))
      .sort((a, b) => b.correctionCount - a.correctionCount);

    return matches.length > 0 ? matches[0] : null;
  }

  public async save(preference: CategoryPreference): Promise<void> {
    const raw = this.toPersistence(preference);
    const ref = doc(db, this.collectionName, preference.id);
    await setDoc(ref, raw, { merge: true });
  }

  public async recordCorrection(params: {
    userId: string;
    productTitle: string;
    targetCategoryId: string;
    targetCategoryName: string;
    targetSubcategoryId?: string | null;
    targetSubcategoryName?: string | null;
  }): Promise<CategoryPreference> {
    const activeUid = auth.currentUser?.uid || params.userId;
    const cleanTitle = params.productTitle.toLowerCase().trim();
    // Extract key 2-3 word pattern from title
    const words = cleanTitle.split(/\s+/).filter((w) => w.length > 3).slice(0, 3);
    const keywordPattern = words.length > 0 ? words.join(' ') : cleanTitle;

    const existing = await this.findMatching(activeUid, keywordPattern);

    if (existing) {
      existing.targetCategoryId = params.targetCategoryId;
      existing.targetCategoryName = params.targetCategoryName;
      existing.targetSubcategoryId = params.targetSubcategoryId || null;
      existing.targetSubcategoryName = params.targetSubcategoryName || null;
      existing.incrementCorrection();
      await this.save(existing);
      return existing;
    } else {
      const newPref = new CategoryPreference({
        id: `pref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: activeUid,
        keywordPattern,
        targetCategoryId: params.targetCategoryId,
        targetCategoryName: params.targetCategoryName,
        targetSubcategoryId: params.targetSubcategoryId || null,
        targetSubcategoryName: params.targetSubcategoryName || null,
        correctionCount: 1,
        lastUsedAt: new Date(),
        createdAt: new Date(),
      });
      await this.save(newPref);
      return newPref;
    }
  }

  private toDomain(doc: FirestoreCategoryPreferenceDoc): CategoryPreference {
    return new CategoryPreference({
      id: doc.id,
      userId: doc.userId,
      keywordPattern: doc.keywordPattern,
      targetCategoryId: doc.targetCategoryId,
      targetCategoryName: doc.targetCategoryName,
      targetSubcategoryId: doc.targetSubcategoryId,
      targetSubcategoryName: doc.targetSubcategoryName,
      correctionCount: doc.correctionCount || 1,
      lastUsedAt: new Date(doc.lastUsedAt),
      createdAt: new Date(doc.createdAt),
    });
  }

  private toPersistence(entity: CategoryPreference): FirestoreCategoryPreferenceDoc {
    const activeUid = auth.currentUser?.uid || entity.userId;
    return {
      id: entity.id,
      userId: activeUid,
      tenantId: activeUid,
      keywordPattern: entity.keywordPattern,
      targetCategoryId: entity.targetCategoryId,
      targetCategoryName: entity.targetCategoryName,
      targetSubcategoryId: entity.targetSubcategoryId,
      targetSubcategoryName: entity.targetSubcategoryName,
      correctionCount: entity.correctionCount,
      lastUsedAt: entity.lastUsedAt.toISOString(),
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
