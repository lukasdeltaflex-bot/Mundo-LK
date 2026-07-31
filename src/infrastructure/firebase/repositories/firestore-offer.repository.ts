import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase.config';
import { IOfferRepository } from '../../../core/domain/ports/repositories/IOfferRepository';
import { Offer } from '../../../core/domain/entities/offer.entity';
import { OfferMapper, FirestoreOfferDoc } from '../mappers/offer.mapper';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

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
      const q = query(collection(db, this.collectionName), ...constraints, limit(50));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc));
    } catch (err) {
      console.warn('[FirestoreOfferRepository] findByProductId error:', err);
      return [];
    }
  }

  public async findByUserId(userId: string): Promise<Offer[]> {
    try {
      const q = query(collection(db, this.collectionName), where('userId', '==', userId), limit(50));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc));
    } catch (err) {
      console.warn('[FirestoreOfferRepository] findByUserId error:', err);
      return [];
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 20,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<Offer>> {
    try {
      const constraints: any[] = [where('userId', '==', userId), limit(pageSize)];
      if (lastDocSnap) {
        constraints.push(startAfter(lastDocSnap));
      }
      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc));
      const newLastSnap = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return {
        items,
        cursor: newLastSnap,
        hasMore: snap.docs.length === pageSize,
      };
    } catch (err) {
      console.warn('[FirestoreOfferRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }

  public async save(offer: Offer): Promise<void> {
    // ── ETAPA 2: Hard fail se usuário não autenticado ─────────────────────
    // Não usar fallback silencioso para evitar dado órfão no Firestore
    const activeUid = auth.currentUser?.uid;
    if (!activeUid) {
      throw new Error(
        '[FirestoreOfferRepository] Usuário não autenticado ao salvar oferta. ' +
        'A sessão pode ter expirado. Faça login novamente.'
      );
    }

    const raw = OfferMapper.toPersistence(offer);
    const cleanRaw = {
      ...raw,
      userId: activeUid,
      tenantId: activeUid, // tenantId SEMPRE == userId para garantir regras Firestore
    };

    try {
      const ref = doc(db, this.collectionName, offer.id);
      await setDoc(ref, cleanRaw, { merge: true });

      // ── Log de auditoria de persistência ──────────────────────────────
      console.log(
        `[AUDIT] Offer ${offer.id} salva com sucesso.` +
        ` uid=${activeUid} | tenantId=${activeUid}` +
        ` | marketplace=${offer.marketplaceId || 'N/A'}` +
        ` | detectedBy=${offer.marketplaceDetectedBy || 'N/A'}`
      );
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
