import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { IProductRepository } from '../../../core/domain/ports/repositories/IProductRepository';
import { Product } from '../../../core/domain/entities/product.entity';
import { ProductMapper, FirestoreProductDoc } from '../mappers/product.mapper';

export class FirestoreProductRepository implements IProductRepository {
  private collectionName = 'products';
  private memoryStore: Map<string, FirestoreProductDoc & { deletedAt?: string; deletionReason?: string }> = new Map();

  public async findById(id: string): Promise<Product | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return ProductMapper.toDomain(snap.data() as FirestoreProductDoc);
      }
    } catch {
      const mem = this.memoryStore.get(id);
      if (mem) return ProductMapper.toDomain(mem);
    }
    return null;
  }

  public async findByOriginalUrl(url: string): Promise<Product | null> {
    try {
      const q = query(collection(db, this.collectionName), where('originalUrl', '==', url));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return ProductMapper.toDomain(snap.docs[0].data() as FirestoreProductDoc);
      }
    } catch {
      for (const item of this.memoryStore.values()) {
        if (item.originalUrl === url) return ProductMapper.toDomain(item);
      }
    }
    return null;
  }

  public async findAll(userId: string): Promise<Product[]> {
    try {
      const q = query(collection(db, this.collectionName), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs
        .map((docSnap) => docSnap.data() as FirestoreProductDoc)
        .filter((d) => !d.status || d.status === 'ACTIVE')
        .map((d) => ProductMapper.toDomain(d));
    } catch {
      const results: Product[] = [];
      for (const item of this.memoryStore.values()) {
        if (item.userId === userId && (!item.status || item.status === 'ACTIVE')) {
          results.push(ProductMapper.toDomain(item));
        }
      }
      return results;
    }
  }

  public async findTrashed(userId: string): Promise<Array<FirestoreProductDoc & { deletedAt: string; deletionReason: string }>> {
    try {
      const q = query(collection(db, this.collectionName), where('userId', '==', userId), where('status', '==', 'TRASHED'));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => docSnap.data() as FirestoreProductDoc & { deletedAt: string; deletionReason: string });
    } catch {
      const results: Array<FirestoreProductDoc & { deletedAt: string; deletionReason: string }> = [];
      for (const item of this.memoryStore.values()) {
        if (item.userId === userId && item.status === 'TRASHED') {
          results.push({
            ...item,
            deletedAt: item.deletedAt || new Date().toISOString(),
            deletionReason: item.deletionReason || 'Não informado',
            status: 'TRASHED',
          });
        }
      }
      return results;
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

    const mem = this.memoryStore.get(id);
    if (mem) {
      this.memoryStore.set(id, { ...mem, ...updateData });
    }

    try {
      const ref = doc(db, this.collectionName, id);
      await updateDoc(ref, updateData);

      const trashRef = doc(db, 'trash_products', id);
      await setDoc(trashRef, { id, productId: id, userId, reason, deletedAt }, { merge: true });
    } catch (error) {
      console.warn('[FirestoreProductRepository] Moved to trash in memory fallback:', error);
    }
  }

  public async restoreFromTrash(id: string): Promise<void> {
    const restoredAt = new Date().toISOString();
    const updateData = {
      status: 'ACTIVE' as const,
      restoredAt,
      updatedAt: restoredAt,
    };

    const mem = this.memoryStore.get(id);
    if (mem) {
      this.memoryStore.set(id, { ...mem, status: 'ACTIVE' });
    }

    try {
      const ref = doc(db, this.collectionName, id);
      await updateDoc(ref, updateData);

      const trashRef = doc(db, 'trash_products', id);
      await deleteDoc(trashRef);
    } catch (error) {
      console.warn('[FirestoreProductRepository] Restored from trash in memory fallback:', error);
    }
  }

  public async save(product: Product): Promise<void> {
    const raw = ProductMapper.toPersistence(product);
    this.memoryStore.set(product.id, { ...raw, status: 'ACTIVE' });
    try {
      const ref = doc(db, this.collectionName, product.id);
      await setDoc(ref, { ...raw, status: 'ACTIVE' }, { merge: true });
    } catch (error) {
      console.warn('[FirestoreProductRepository] Persisted to memory fallback:', error);
    }
  }

  public async delete(id: string): Promise<void> {
    this.memoryStore.delete(id);
    try {
      const ref = doc(db, this.collectionName, id);
      await deleteDoc(ref);

      const trashRef = doc(db, 'trash_products', id);
      await deleteDoc(trashRef);
    } catch (error) {
      console.warn('[FirestoreProductRepository] Permanent deletion fallback:', error);
    }
  }
}
