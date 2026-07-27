import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { IProductRepository } from '../../../core/domain/ports/repositories/IProductRepository';
import { Product } from '../../../core/domain/entities/product.entity';
import { ProductMapper, FirestoreProductDoc } from '../mappers/product.mapper';

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
      const q = query(collection(db, this.collectionName), ...constraints);
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
      const q = query(collection(db, this.collectionName), where('userId', '==', userId));
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
    try {
      const ref = doc(db, this.collectionName, product.id);
      await setDoc(ref, { ...raw, status: 'ACTIVE' }, { merge: true });
    } catch (error) {
      console.error('[FirestoreProductRepository] Erro ao salvar no Firestore:', error);
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);

    const trashRef = doc(db, 'trash_products', id);
    await deleteDoc(trashRef);
  }
}
