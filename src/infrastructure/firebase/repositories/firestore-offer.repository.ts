import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { IOfferRepository } from '../../../core/domain/ports/repositories/IOfferRepository';
import { Offer } from '../../../core/domain/entities/offer.entity';
import { OfferMapper, FirestoreOfferDoc } from '../mappers/offer.mapper';

export class FirestoreOfferRepository implements IOfferRepository {
  private collectionName = 'offers';
  private memoryStore: Map<string, FirestoreOfferDoc> = new Map();

  public async findById(id: string): Promise<Offer | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return OfferMapper.toDomain(snap.data() as FirestoreOfferDoc);
      }
    } catch {
      const mem = this.memoryStore.get(id);
      if (mem) return OfferMapper.toDomain(mem);
    }
    return null;
  }

  public async findByProductId(productId: string): Promise<Offer[]> {
    try {
      const snap = await getDocs(collection(db, this.collectionName));
      return snap.docs
        .map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc))
        .filter((o) => o.productId === productId);
    } catch {
      return Array.from(this.memoryStore.values())
        .filter((docItem) => docItem.productId === productId)
        .map((docItem) => OfferMapper.toDomain(docItem));
    }
  }

  public async findByUserId(userId: string): Promise<Offer[]> {
    try {
      const snap = await getDocs(collection(db, this.collectionName));
      return snap.docs.map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc));
    } catch {
      return Array.from(this.memoryStore.values()).map((docItem) => OfferMapper.toDomain(docItem));
    }
  }

  public async save(offer: Offer): Promise<void> {
    const raw = OfferMapper.toPersistence(offer);
    this.memoryStore.set(offer.id, raw);
    try {
      const ref = doc(db, this.collectionName, offer.id);
      await setDoc(ref, raw, { merge: true });
    } catch (error) {
      console.warn('[FirestoreOfferRepository] Persisted to memory fallback:', error);
    }
  }

  public async delete(id: string): Promise<void> {
    this.memoryStore.delete(id);
    try {
      const ref = doc(db, this.collectionName, id);
      await deleteDoc(ref);
    } catch (error) {
      console.warn('[FirestoreOfferRepository] Deleted from memory fallback:', error);
    }
  }
}
