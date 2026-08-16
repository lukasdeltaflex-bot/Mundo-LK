import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
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
      const constraints = [where('userId', '==', userId), limit(500)];
      const q = query(collection(db, this.collectionName), ...constraints);

      const snap = await getDocs(q);

      const items = snap.docs.map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc));
      return items.sort((a, b) => (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0));
    } catch (err: any) {

      console.error('[AUDIT] Firestore Error', {
        code: err?.code || 'unknown',
        message: err?.message || String(err),
      });
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

      // ── ETAPA 2 & 6 & 7: AUDITORIA DE LEITURA PAGINADA ─────────────────
      console.group('[AUDIT] Firestore Offers (Paged)');
      console.log('Project:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mundo-lk-eb4da');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Current UID:', auth.currentUser?.uid);
      console.log('Current Email:', auth.currentUser?.email);
      console.log('Query Collection:', this.collectionName);
      console.log('Query Target userId:', userId);
      console.log('Documents Returned:', snap.size);
      snap.docs.forEach((d) => {
        const data = d.data();
        console.log(d.id, {
          userId: data.userId,
          tenantId: data.tenantId,
          marketplaceId: data.marketplaceId,
          marketplaceName: data.marketplaceName,
          createdAt: data.createdAt,
        });
      });
      console.groupEnd();

      const items = snap.docs
        .map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc))
        .sort((a, b) => (b.createdAt ? b.createdAt.getTime() : 0) - (a.createdAt ? a.createdAt.getTime() : 0));
      const newLastSnap = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return {
        items,
        cursor: newLastSnap,
        hasMore: snap.docs.length === pageSize,
      };
    } catch (err: any) {
      console.error('[AUDIT] Firestore Error', {
        code: err?.code || 'unknown',
        message: err?.message || String(err),
      });
      return { items: [], hasMore: false };
    }
  }

  public async create(offer: Offer): Promise<void> {
    const activeUid = offer.userId || auth.currentUser?.uid;
    if (!activeUid) {
      throw new Error(
        '[FirestoreOfferRepository] Usuário não autenticado ao criar oferta.'
      );
    }

    const uniqueOfferId = offer.id && offer.id.trim().length > 3
      ? offer.id
      : `off_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const raw = OfferMapper.toPersistence(offer);
    const cleanRaw = {
      ...raw,
      id: uniqueOfferId,
      userId: activeUid,
      tenantId: activeUid,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const documentPath = `${this.collectionName}/${uniqueOfferId}`;
    const authUid = auth.currentUser?.uid || null;

    console.log('[FS_WRITE_ATTEMPT]', {
      operation: 'CREATE',
      collection: this.collectionName,
      documentPath,
      documentId: uniqueOfferId,
      authUid,
      payloadUserId: activeUid,
      productId: offer.productId,
      offerId: uniqueOfferId,
      marketplace: offer.marketplaceId,
    });

    try {
      const ref = doc(db, this.collectionName, uniqueOfferId);
      await setDoc(ref, cleanRaw);
      console.log('[FS_WRITE_SUCCESS]', {
        operation: 'CREATE',
        collection: this.collectionName,
        documentPath,
        documentId: uniqueOfferId,
      });
    } catch (error: any) {
      console.error('[FS_WRITE_ERROR]', {
        code: error?.code || 'unknown',
        message: error?.message || String(error),
        operation: 'CREATE',
        collection: this.collectionName,
        documentPath,
        documentId: uniqueOfferId,
        authUid,
        payloadUserId: activeUid,
        productId: offer.productId,
        offerId: uniqueOfferId,
      });
      throw error;
    }
  }

  public async update(id: string, offerChanges: Partial<Offer>): Promise<void> {
    const activeUid = auth.currentUser?.uid;
    if (!activeUid) {
      throw new Error('[FirestoreOfferRepository] Usuário não autenticado ao atualizar oferta.');
    }
    if (!id) {
      throw new Error('[FirestoreOfferRepository] ID da oferta é obrigatório para atualização.');
    }

    try {
      const ref = doc(db, this.collectionName, id);
      const updatePayload: Record<string, any> = {};

      if (offerChanges.scoreValue !== undefined) updatePayload.scoreValue = offerChanges.scoreValue;
      if (offerChanges.scoreLabel !== undefined) updatePayload.scoreLabel = offerChanges.scoreLabel;
      if (offerChanges.scoreJustification !== undefined) updatePayload.scoreJustification = offerChanges.scoreJustification;
      if (offerChanges.cta !== undefined) updatePayload.cta = offerChanges.cta;
      if (offerChanges.hashtags !== undefined) updatePayload.hashtags = offerChanges.hashtags;
      if (offerChanges.marketplaceId !== undefined) updatePayload.marketplaceId = offerChanges.marketplaceId;
      if (offerChanges.marketplaceName !== undefined) updatePayload.marketplaceName = offerChanges.marketplaceName;
      if (offerChanges.copies !== undefined) {
        const rawCopies = typeof (offerChanges.copies as any).copies === 'object'
          ? (offerChanges.copies as any).copies
          : offerChanges.copies;
        updatePayload.copies = { copies: rawCopies };
      }

      updatePayload.updatedAt = new Date().toISOString();
      await updateDoc(ref, updatePayload);
      console.log('[FirestoreOfferRepository] Oferta atualizada com sucesso:', id);
    } catch (error) {
      console.error('[FirestoreOfferRepository] Erro ao atualizar oferta:', error);
      throw error;
    }
  }

  public async save(offer: Offer): Promise<void> {
    if (offer.id) {
      const existing = await this.findById(offer.id);
      if (existing) {
        await this.update(offer.id, offer);
        return;
      }
    }
    await this.create(offer);
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
