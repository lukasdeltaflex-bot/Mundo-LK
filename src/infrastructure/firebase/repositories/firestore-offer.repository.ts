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
      const constraints = [where('userId', '==', userId), limit(50)];
      const q = query(collection(db, this.collectionName), ...constraints);

      // Read-only Pre-getDocs Forensic Event
      try {
        const { forensicCollector } = await import('@/infrastructure/telemetry/forensic-collector');
        forensicCollector.recordEvent('FIRESTORE', 'INICIANDO_findByUserId', {
          targetUserId: userId,
          authCurrentUserUid: auth.currentUser?.uid || null,
          collection: this.collectionName,
        });
      } catch (e) {
        // Safe catch
      }

      const snap = await getDocs(q);

      // Read-only Post-getDocs Forensic Event
      try {
        const { forensicCollector } = await import('@/infrastructure/telemetry/forensic-collector');
        forensicCollector.recordEvent('FIRESTORE', 'SUCESSO_findByUserId', {
          targetUserId: userId,
          documentsReturned: snap.size,
          docIds: snap.docs.map((d) => d.id),
          authCurrentUserUid: auth.currentUser?.uid || null,
        });
      } catch (e) {
        // Safe catch
      }

      // ── ETAPA 2 & 6 & 7: AUDITORIA DE LEITURA ───────────────────────────
      console.group('[AUDIT] Firestore Offers');
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

      return snap.docs.map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc));
    } catch (err: any) {
      try {
        const { forensicCollector } = await import('@/infrastructure/telemetry/forensic-collector');
        forensicCollector.recordEvent('FIRESTORE', 'ERRO_findByUserId', {
          targetUserId: userId,
          code: err?.code || 'unknown',
          message: err?.message || String(err),
          name: err?.name || 'Error',
          stack: err?.stack || null,
          authCurrentUserUid: auth.currentUser?.uid || null,
        });
      } catch (e) {
        // Safe catch
      }

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

      const items = snap.docs.map((docSnap) => OfferMapper.toDomain(docSnap.data() as FirestoreOfferDoc));
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

  public async save(offer: Offer): Promise<void> {
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

      // ── ETAPA 1: VERIFICAÇÃO IMEDIATA APÓS setDoc() ──────────────────────
      const checkSnap = await getDoc(ref);
      if (!checkSnap.exists()) {
        const err = new Error(`[AUDIT FAIL] Documento ${offer.id} não foi encontrado no Firestore imediatamente após setDoc()!`);
        console.error('[AUDIT ERROR]', err.message);
        throw err;
      }

      const savedData = checkSnap.data();
      console.log('[AUDIT] Offer Saved', {
        'Document ID': offer.id,
        userId: savedData.userId,
        tenantId: savedData.tenantId,
        marketplaceId: savedData.marketplaceId || 'N/A',
        createdAt: savedData.createdAt,
      });
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
