import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import {
  MarketplaceOperationLog,
  MarketplaceOperationLogProps,
} from '../../../core/domain/entities/marketplace-operation-log.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreMarketplaceOperationLogRepository {
  private collectionName = 'marketplace_operation_logs';

  public async record(props: MarketplaceOperationLogProps): Promise<void> {
    try {
      const log = new MarketplaceOperationLog(props);
      const ref = doc(db, this.collectionName, log.id);
      await setDoc(ref, {
        id: log.id,
        userId: log.userId,
        tenantId: log.tenantId,
        type: log.type,
        marketplaceSlug: log.marketplaceSlug,
        status: log.status,
        durationMs: log.durationMs,
        metadata: log.metadata ?? {},
        createdAt: log.createdAt,
      });
    } catch (err) {
      console.warn('[FirestoreMarketplaceOperationLogRepository] record error:', err);
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 50,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<MarketplaceOperationLog>> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => new MarketplaceOperationLog(d.data() as MarketplaceOperationLogProps));
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreMarketplaceOperationLogRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }
}
