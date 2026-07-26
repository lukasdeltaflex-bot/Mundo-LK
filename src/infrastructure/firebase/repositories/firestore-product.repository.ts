import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { IProductRepository } from '../../../core/domain/ports/repositories/IProductRepository';
import { Product } from '../../../core/domain/entities/product.entity';
import { ProductMapper, FirestoreProductDoc } from '../mappers/product.mapper';

export class FirestoreProductRepository implements IProductRepository {
  private collectionName = 'products';
  // In-memory fallback map for dev environment without live Firebase connection
  private memoryStore: Map<string, FirestoreProductDoc> = new Map();

  public async findById(id: string): Promise<Product | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return ProductMapper.toDomain(snap.data() as FirestoreProductDoc);
      }
    } catch {
      // Fallback memory check
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
      return snap.docs.map((docSnap) => ProductMapper.toDomain(docSnap.data() as FirestoreProductDoc));
    } catch {
      const results: Product[] = [];
      for (const item of this.memoryStore.values()) {
        if (item.userId === userId) results.push(ProductMapper.toDomain(item));
      }
      return results;
    }
  }

  public async save(product: Product): Promise<void> {
    const raw = ProductMapper.toPersistence(product);
    this.memoryStore.set(product.id, raw);
    try {
      const ref = doc(db, this.collectionName, product.id);
      await setDoc(ref, raw, { merge: true });
    } catch (error) {
      console.warn('[FirestoreProductRepository] Persisted to memory fallback due to network/config:', error);
    }
  }

  public async delete(id: string): Promise<void> {
    this.memoryStore.delete(id);
    try {
      const ref = doc(db, this.collectionName, id);
      await deleteDoc(ref);
    } catch (error) {
      console.warn('[FirestoreProductRepository] Deleted from memory fallback:', error);
    }
  }
}
