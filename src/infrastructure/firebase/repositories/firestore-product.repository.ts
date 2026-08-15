import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc, limit, startAfter, QueryDocumentSnapshot, writeBatch } from 'firebase/firestore';
import { db, auth } from '../config/firebase.config';
import { IProductRepository } from '../../../core/domain/ports/repositories/IProductRepository';
import { Product } from '../../../core/domain/entities/product.entity';
import { ProductMapper, FirestoreProductDoc } from '../mappers/product.mapper';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreProductRepository implements IProductRepository {
  private collectionName = 'products';

  public async findById(id: string): Promise<Product | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return ProductMapper.toDomain(snap.data() as FirestoreProductDoc);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreProductRepository] findById error:', err);
      return null;
    }
  }

  public async findByOriginalUrl(url: string, userId?: string): Promise<Product | null> {
    try {
      const constraints = [where('originalUrl', '==', url)];
      if (userId) {
        constraints.push(where('userId', '==', userId));
      }
      const q = query(collection(db, this.collectionName), ...constraints, limit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return ProductMapper.toDomain(snap.docs[0].data() as FirestoreProductDoc);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreProductRepository] findByOriginalUrl error:', err);
      return null;
    }
  }

  public async findAll(userId: string): Promise<Product[]> {
    try {
      const q = query(collection(db, this.collectionName), where('userId', '==', userId), limit(50));
      const snap = await getDocs(q);
      return snap.docs
        .map((docSnap) => docSnap.data() as FirestoreProductDoc)
        .filter((d) => !d.status || d.status === 'ACTIVE')
        .map((d) => ProductMapper.toDomain(d));
    } catch (err) {
      console.warn('[FirestoreProductRepository] findAll error:', err);
      return [];
    }
  }

  public async findPaged(
    userId: string,
    pageSize: number = 20,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<Product>> {
    try {
      const constraints: any[] = [where('userId', '==', userId), limit(pageSize)];
      if (lastDocSnap) {
        constraints.push(startAfter(lastDocSnap));
      }
      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs
        .map((docSnap) => docSnap.data() as FirestoreProductDoc)
        .filter((d) => !d.status || d.status === 'ACTIVE')
        .map((d) => ProductMapper.toDomain(d));

      const newLastSnap = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return {
        items,
        cursor: newLastSnap,
        hasMore: snap.docs.length === pageSize,
      };
    } catch (err) {
      console.warn('[FirestoreProductRepository] findPaged error:', err);
      return { items: [], hasMore: false };
    }
  }

  public async findTrashed(userId: string): Promise<Array<FirestoreProductDoc & { deletedAt: string; deletionReason: string }>> {
    try {
      const q = query(collection(db, this.collectionName), where('userId', '==', userId), where('status', '==', 'TRASHED'));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => docSnap.data() as FirestoreProductDoc & { deletedAt: string; deletionReason: string });
    } catch (err) {
      console.warn('[FirestoreProductRepository] findTrashed error:', err);
      return [];
    }
  }

  public async moveToTrash(id: string, reason: string, userId: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    const updateData = {
      status: 'TRASHED' as const,
      deletedAt,
      deletedBy: userId,
      deletionReason: reason,
      updatedAt: deletedAt,
    };

    const ref = doc(db, this.collectionName, id);
    await updateDoc(ref, updateData);

    const trashRef = doc(db, 'trash_products', id);
    await setDoc(trashRef, { id, productId: id, userId, reason, deletedAt }, { merge: true });
  }

  public async moveManyToTrash(ids: string[], reason: string, userId: string): Promise<void> {
    if (ids.length === 0) return;
    const deletedAt = new Date().toISOString();

    // Process in chunks of 250 (max 500 ops per Firestore batch: 2 ops per product)
    const chunkSize = 200;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((id) => {
        const prodRef = doc(db, this.collectionName, id);
        batch.update(prodRef, {
          status: 'TRASHED',
          deletedAt,
          deletedBy: userId,
          deletionReason: reason,
          updatedAt: deletedAt,
        });

        const trashRef = doc(db, 'trash_products', id);
        batch.set(trashRef, { id, productId: id, userId, reason, deletedAt }, { merge: true });
      });

      await batch.commit();
    }
  }

  public async updateCategoryBatch(products: Product[]): Promise<void> {
    if (products.length === 0) return;
    const chunkSize = 400; // max 500 ops per Firestore writeBatch

    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((p) => {
        const prodRef = doc(db, this.collectionName, p.id);
        const raw = ProductMapper.toPersistence(p);
        batch.update(prodRef, {
          categoryId: raw.categoryId,
          subcategoryId: raw.subcategoryId || null,
          categorySource: raw.categorySource,
          categoryConfidence: raw.categoryConfidence ?? null,
          categoryLocked: raw.categoryLocked ?? false,
          categoryUpdatedAt: raw.categoryUpdatedAt,
          categoryReasoning: raw.categoryReasoning || null,
          updatedAt: raw.updatedAt,
        });
      });

      await batch.commit();
    }
  }

  public async restoreFromTrash(id: string): Promise<void> {
    const restoredAt = new Date().toISOString();
    const updateData = {
      status: 'ACTIVE' as const,
      restoredAt,
      updatedAt: restoredAt,
    };

    const ref = doc(db, this.collectionName, id);
    await updateDoc(ref, updateData);

    const trashRef = doc(db, 'trash_products', id);
    await deleteDoc(trashRef);
  }
  public async save(product: Product): Promise<void> {
    const raw = ProductMapper.toPersistence(product);
    const activeUid = product.userId || auth.currentUser?.uid;
    if (!activeUid) {
      throw new Error('[FirestoreProductRepository] Usuário não autenticado ao salvar produto.');
    }
    const cleanRaw = {
      ...raw,
      userId: activeUid,
      tenantId: activeUid,
      status: 'ACTIVE' as const,
    };
    try {
      const ref = doc(db, this.collectionName, product.id);
      await setDoc(ref, cleanRaw, { merge: true });
    } catch (error) {
      console.error('[FirestoreProductRepository] Erro ao salvar no Firestore:', error);
      throw error;
    }
  }

  public async update(id: string, productChanges: Partial<Product>): Promise<void> {
    const activeUid = auth.currentUser?.uid;
    if (!activeUid) {
      throw new Error('[FirestoreProductRepository] Usuário não autenticado ao atualizar produto.');
    }
    if (!id) {
      throw new Error('[FirestoreProductRepository] ID do produto é obrigatório para atualização.');
    }

    try {
      const ref = doc(db, this.collectionName, id);
      const rawChanges: Record<string, any> = {};

      if (productChanges.title !== undefined) rawChanges.title = productChanges.title;
      if (productChanges.description !== undefined) rawChanges.description = productChanges.description;
      if (productChanges.brand !== undefined) rawChanges.brand = productChanges.brand;
      if (productChanges.categoryId !== undefined) rawChanges.categoryId = productChanges.categoryId;
      if (productChanges.subcategoryId !== undefined) rawChanges.subcategoryId = productChanges.subcategoryId;
      if (productChanges.images !== undefined) rawChanges.images = productChanges.images;
      if (productChanges.currentPrice !== undefined) {
        rawChanges.currentPrice = typeof productChanges.currentPrice === 'number'
          ? productChanges.currentPrice
          : productChanges.currentPrice?.amount || 0;
      }
      if (productChanges.previousPrice !== undefined) {
        rawChanges.previousPrice = productChanges.previousPrice
          ? (typeof productChanges.previousPrice === 'number' ? productChanges.previousPrice : productChanges.previousPrice.amount)
          : null;
      }
      if (productChanges.status !== undefined) rawChanges.status = productChanges.status;

      rawChanges.updatedAt = new Date().toISOString();

      await updateDoc(ref, rawChanges);
      console.log('[FirestoreProductRepository] Produto atualizado com sucesso:', id);
    } catch (error) {
      console.error('[FirestoreProductRepository] Erro ao atualizar produto:', error);
      throw error;
    }
  }

  public async updateDispatchHistory(product: Product): Promise<void> {
    const ref = doc(db, this.collectionName, product.id);
    const raw = ProductMapper.toPersistence(product);
    await setDoc(ref, {
      dispatchCount: raw.dispatchCount,
      firstDispatchedAt: raw.firstDispatchedAt,
      lastDispatchedAt: raw.lastDispatchedAt,
      lastChannel: raw.lastChannel,
      dispatchHistory: raw.dispatchHistory,
      updatedAt: raw.updatedAt,
    }, { merge: true });
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);

    const trashRef = doc(db, 'trash_products', id);
    await deleteDoc(trashRef);
  }
}
