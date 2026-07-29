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
  MarketplaceListingAttempt,
  MarketplaceListingAttemptProps,
} from '../../../core/domain/entities/marketplace-listing-attempt.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreMarketplaceListingAttemptRepository {
  private collectionName = 'marketplace_listing_attempts';

  public async record(props: MarketplaceListingAttemptProps): Promise<void> {
    try {
      const attempt = new MarketplaceListingAttempt(props);
      const ref = doc(db, this.collectionName, attempt.id);
      await setDoc(ref, {
        id: attempt.id,
        listingId: attempt.listingId,
        userId: attempt.userId,
        tenantId: attempt.tenantId,
        marketplaceSlug: attempt.marketplaceSlug,
        status: attempt.status,
        requestPayload: attempt.requestPayload,
        responsePayload: attempt.responsePayload ?? {},
        error: attempt.error ?? null,
        createdAt: attempt.createdAt,
      });
    } catch (err) {
      console.warn('[FirestoreMarketplaceListingAttemptRepository] record error:', err);
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 50,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<MarketplaceListingAttempt>> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => new MarketplaceListingAttempt(d.data() as MarketplaceListingAttemptProps));
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreMarketplaceListingAttemptRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }
}
