import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase.config';
import { ICategoryRepository } from '../../../core/domain/ports/repositories/ICategoryRepository';
import { ManagedCategory, ManagedCategoryProps } from '../../../core/domain/entities/managed-category.entity';

export interface FirestoreCategoryDoc {
  id: string;
  userId: string;
  tenantId?: string;
  name: string;
  slug: string;
  description: string;
  parentCategoryId: string | null;
  active: boolean;
  iconName: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export class FirestoreCategoryRepository implements ICategoryRepository {
  private collectionName = 'categories';

  public async findById(id: string): Promise<ManagedCategory | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return this.toDomain(snap.data() as FirestoreCategoryDoc);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreCategoryRepository] findById error:', err);
      return null;
    }
  }

  public async findAll(userId: string): Promise<ManagedCategory[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        return this.seedDefaultsIfEmpty(userId);
      }
      return snap.docs.map((docSnap) => this.toDomain(docSnap.data() as FirestoreCategoryDoc));
    } catch (err) {
      console.warn('[FirestoreCategoryRepository] findAll error:', err);
      return [];
    }
  }

  public async save(category: ManagedCategory): Promise<void> {
    const activeUid = auth.currentUser?.uid || category.userId;
    if (!activeUid) {
      const authErr: any = new Error('[FirestoreCategoryRepository] Usuário não autenticado no Firebase Auth (auth.currentUser nulo).');
      authErr.code = 'unauthenticated';
      throw authErr;
    }

    const raw = this.toPersistence(category);

    console.log('[FirestoreCategoryRepository.save] Gravando no Firestore:', {
      collection: this.collectionName,
      docId: category.id,
      authUid: activeUid,
      payload: raw,
    });

    try {
      const ref = doc(db, this.collectionName, category.id);
      await setDoc(ref, raw, { merge: true });
      console.log('[FirestoreCategoryRepository.save] Documento salvo com sucesso:', category.id);
    } catch (err: any) {
      console.error('[FirestoreCategoryRepository.save] FALHA AO GRAVAR NO FIRESTORE:', {
        docId: category.id,
        code: err?.code,
        message: err?.message,
        name: err?.name,
        err,
      });
      throw err;
    }
  }

  public async saveBatch(categories: ManagedCategory[]): Promise<void> {
    if (categories.length === 0) return;
    const batch = writeBatch(db);
    for (const cat of categories) {
      const raw = this.toPersistence(cat);
      const ref = doc(db, this.collectionName, cat.id);
      batch.set(ref, raw, { merge: true });
    }
    try {
      await batch.commit();
    } catch (err: any) {
      console.error('[FirestoreCategoryRepository.saveBatch] FALHA NO BATCH:', {
        code: err?.code,
        message: err?.message,
        err,
      });
      throw err;
    }
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);
  }

  public async seedDefaultsIfEmpty(userId: string): Promise<ManagedCategory[]> {
    const activeUid = auth.currentUser?.uid || userId || 'user_default';

    const defaultCategories: Array<{ name: string; icon: string; subcategories?: string[] }> = [
      {
        name: 'Beleza',
        icon: 'Sparkles',
        subcategories: ['Cuidados com a Pele', 'Cabelos', 'Maquiagem', 'Perfumes'],
      },
      {
        name: 'Eletrônicos',
        icon: 'Smartphone',
        subcategories: ['Celulares', 'Acessórios', 'Informática', 'Áudio'],
      },
      { name: 'Moda', icon: 'Shirt', subcategories: ['Feminino', 'Masculino', 'Calçados'] },
      { name: 'Informática', icon: 'Laptop', subcategories: ['Notebooks', 'Periféricos', 'Monitores'] },
      { name: 'Casa', icon: 'Home', subcategories: ['Cozinha', 'Decoração', 'Cama e Banho'] },
      { name: 'Acessórios', icon: 'Watch', subcategories: ['Relógios', 'Óculos', 'Bolsas'] },
      { name: 'Saúde e Bem-estar', icon: 'Heart', subcategories: ['Suplementos', 'Higiene Personalada'] },
      { name: 'Infantil', icon: 'Baby', subcategories: ['Brinquedos', 'Roupas Infantis', 'Bebês'] },
      { name: 'Esportes', icon: 'Activity', subcategories: ['Fitness', 'Futebol', 'Ciclismo'] },
      { name: 'Automotivo', icon: 'Car', subcategories: ['Acessórios para Carros', 'Peças'] },
      { name: 'Pet', icon: 'Dog', subcategories: ['Alimentação', 'Acessórios Pet'] },
      { name: 'Outros', icon: 'Tag', subcategories: [] },
    ];

    const list: ManagedCategory[] = [];

    for (const item of defaultCategories) {
      const parentId = `cat_${ManagedCategory.slugify(item.name)}`;
      const parent = new ManagedCategory({
        id: parentId,
        userId: activeUid,
        name: item.name,
        slug: ManagedCategory.slugify(item.name),
        description: `Categoria de ${item.name}`,
        parentCategoryId: null,
        active: true,
        iconName: item.icon,
      });
      list.push(parent);

      if (item.subcategories) {
        for (const subName of item.subcategories) {
          const subId = `cat_${ManagedCategory.slugify(item.name)}_${ManagedCategory.slugify(subName)}`;
          const sub = new ManagedCategory({
            id: subId,
            userId: activeUid,
            name: subName,
            slug: ManagedCategory.slugify(subName),
            description: `Subcategoria de ${subName}`,
            parentCategoryId: parentId,
            active: true,
            iconName: 'Tag',
          });
          list.push(sub);
        }
      }
    }

    try {
      await this.saveBatch(list);
    } catch (err) {
      console.warn('[FirestoreCategoryRepository] Erro ao semear categorias padrão:', err);
    }

    return list;
  }

  private toDomain(doc: FirestoreCategoryDoc): ManagedCategory {
    return new ManagedCategory({
      id: doc.id,
      userId: doc.userId,
      name: doc.name || 'Sem nome',
      slug: doc.slug || ManagedCategory.slugify(doc.name || 'cat'),
      description: doc.description || '',
      parentCategoryId: doc.parentCategoryId ?? null,
      active: doc.active ?? true,
      iconName: doc.iconName || 'Tag',
      productCount: doc.productCount || 0,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
    });
  }

  private toPersistence(entity: ManagedCategory): FirestoreCategoryDoc {
    const activeUid = auth.currentUser?.uid || entity.userId;
    return {
      id: entity.id,
      userId: activeUid,
      tenantId: activeUid,
      name: entity.name || '',
      slug: entity.slug || ManagedCategory.slugify(entity.name || 'cat'),
      description: entity.description || '',
      parentCategoryId: entity.parentCategoryId ?? null,
      active: entity.active ?? true,
      iconName: entity.iconName || 'Tag',
      productCount: entity.productCount ?? 0,
      createdAt: (entity.createdAt || new Date()).toISOString(),
      updatedAt: (entity.updatedAt || new Date()).toISOString(),
    };
  }
}
