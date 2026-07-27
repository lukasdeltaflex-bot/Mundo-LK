import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { IOfferRepository } from '../../../core/domain/ports/repositories/IOfferRepository';
import { Offer } from '../../../core/domain/entities/offer.entity';
import { OfferMapper, FirestoreOfferDoc } from '../mappers/offer.mapper';

export class FirestoreOfferRepository implements IOfferRepository {
  private collectionName = 'offers';

  public async findById(id: string): Promise<Offer | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return OfferMapper.toDomain(snap.data() as FirestoreOfferDoc);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreOfferRepository] findById error:', err);
      return null;
    }
  }

  public async findByProductId(productId: string, userId?: string): Promise<Offer[]> {
    try {
      const constraints = [where('productId', '==', productId)];
      if (userId) constraints.push(where('userId', '==', userId));
      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc));
    } catch (err) {
      console.warn('[FirestoreOfferRepository] findByProductId error:', err);
      return [];
    }
  }

  public async findByUserId(userId: string): Promise<Offer[]> {
    try {
      const q = query(collection(db, this.collectionName), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc));
    } catch (err) {
      console.warn('[FirestoreOfferRepository] findByUserId error:', err);
      return [];
    }
  }

  public async save(offer: Offer): Promise<void> {
    const raw = OfferMapper.toPersistence(offer);
    try {
      const ref = doc(db, this.collectionName, offer.id);
      await setDoc(ref, raw, { merge: true });
    } catch (error) {
      console.error('[FirestoreOfferRepository] Erro ao salvar no Firestore:', error);
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
