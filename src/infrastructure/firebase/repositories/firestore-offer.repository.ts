import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { IOfferRepository } from '../../../core/domain/ports/repositories/IOfferRepository';
import { Offer } from '../../../core/domain/entities/offer.entity';
import { OfferMapper, FirestoreOfferDoc } from '../mappers/offer.mapper';

export class FirestoreOfferRepository implements IOfferRepository {
  private collectionName = 'offers';

  public async findById(id: string): Promise<Offer | null> {
    const ref = doc(db, this.collectionName, id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return OfferMapper.toDomain(snap.data() as FirestoreOfferDoc);
    }
    return null;
  }

  public async findByProductId(productId: string): Promise<Offer[]> {
    const snap = await getDocs(collection(db, this.collectionName));
    return snap.docs
      .map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc))
      .filter((o) => o.productId === productId);
  }

  public async findByUserId(userId: string): Promise<Offer[]> {
    const snap = await getDocs(collection(db, this.collectionName));
    return snap.docs.map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc));
  }

  public async save(offer: Offer): Promise<void> {
    const raw = OfferMapper.toPersistence(offer);
    try {
      const ref = doc(db, this.collectionName, offer.id);
      await setDoc(ref, raw, { merge: true });
    } catch (error) {
      console.error('[FirestoreOfferRepository] Erro crítico ao salvar no Firestore:', error);
      throw error; // Não usar fallback local
    }
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
