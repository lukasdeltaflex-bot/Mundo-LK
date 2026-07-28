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
  MarketOpportunityHistory,
  MarketOpportunityHistoryProps,
} from '../../../core/domain/entities/market-opportunity-history.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreMarketOpportunityHistoryRepository {
  private collectionName = 'market_opportunity_history';

  public async record(props: MarketOpportunityHistoryProps): Promise<void> {
    try {
      const history = new MarketOpportunityHistory(props);
      const ref = doc(db, this.collectionName, history.id);
      await setDoc(ref, {
        id: history.id,
        userId: history.userId,
        tenantId: history.tenantId,
        recommendationId: history.recommendationId,
        keyword: history.keyword,
        marketplaceSlug: history.marketplaceSlug,
        score: history.score,
        collectedAt: history.collectedAt,
      });
    } catch (err) {
      console.warn('[FirestoreMarketOpportunityHistoryRepository] record error:', err);
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 50,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<MarketOpportunityHistory>> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('collectedAt', 'desc'),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => new MarketOpportunityHistory(d.data() as MarketOpportunityHistoryProps));
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreMarketOpportunityHistoryRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }
}
