import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';

export interface CustomMarketplace {
  slug: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface CustomCategory {
  name: string;
  parentCategory?: string | null;
  userId: string;
  createdAt: string;
}

export class CustomTaxonomyService {
  /**
   * Fetches custom marketplaces created by the user from Firestore.
   */
  public async getCustomMarketplaces(userId: string): Promise<CustomMarketplace[]> {
    if (!userId) return [];
    try {
      const q = query(collection(db, 'custom_marketplaces'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => docSnap.data() as CustomMarketplace);
    } catch (err) {
      console.warn('[CustomTaxonomyService] Erro ao carregar marketplaces customizados:', err);
      return [];
    }
  }

  /**
   * Persists a new custom marketplace in Firestore safely.
   */
  public async createCustomMarketplace(slug: string, name: string, userId: string): Promise<CustomMarketplace> {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (!name.trim()) throw new Error('O nome do marketplace é obrigatório.');

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-');

    const item: CustomMarketplace = {
      slug: cleanSlug,
      name: name.trim(),
      userId,
      createdAt: new Date().toISOString(),
    };

    const ref = doc(db, 'custom_marketplaces', `${userId}_${cleanSlug}`);
    await setDoc(ref, item, { merge: true });

    return item;
  }

  /**
   * Fetches custom categories created by the user from Firestore.
   */
  public async getCustomCategories(userId: string): Promise<CustomCategory[]> {
    if (!userId) return [];
    try {
      const q = query(collection(db, 'custom_categories'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => docSnap.data() as CustomCategory);
    } catch (err) {
      console.warn('[CustomTaxonomyService] Erro ao carregar categorias customizadas:', err);
      return [];
    }
  }

  /**
   * Persists a new custom category in Firestore safely.
   */
  public async createCustomCategory(name: string, parentCategory: string | null, userId: string): Promise<CustomCategory> {
    if (!userId) throw new Error('Usuário não autenticado.');
    if (!name.trim()) throw new Error('O nome da categoria é obrigatório.');

    const cleanName = name.trim();
    const cleanDocId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const item: CustomCategory = {
      name: cleanName,
      parentCategory: parentCategory || null,
      userId,
      createdAt: new Date().toISOString(),
    };

    const ref = doc(db, 'custom_categories', `${userId}_${cleanDocId}`);
    await setDoc(ref, item, { merge: true });

    return item;
  }
}
