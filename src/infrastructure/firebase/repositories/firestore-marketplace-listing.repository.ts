import {
  collection,
  doc,
  getDoc,
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
  MarketplaceListing,
  MarketplaceListingProps,
} from '../../../core/domain/entities/marketplace-listing.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreMarketplaceListingRepository {
  private collectionName = 'marketplace_listings';

  public async findById(id: string): Promise<MarketplaceListing | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return new MarketplaceListing(snap.data() as MarketplaceListingProps);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreMarketplaceListingRepository] findById error:', err);
      return null;
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 20,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<MarketplaceListing>> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => new MarketplaceListing(d.data() as MarketplaceListingProps));
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreMarketplaceListingRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }

  public async findByOfferId(userId: string, offerId: string): Promise<MarketplaceListing[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('offerId', '==', offerId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => new MarketplaceListing(d.data() as MarketplaceListingProps));
    } catch (err) {
      console.warn('[FirestoreMarketplaceListingRepository] findByOfferId error:', err);
      return [];
    }
  }

  public async save(listing: MarketplaceListing): Promise<void> {
    const ref = doc(db, this.collectionName, listing.id);
    await setDoc(
      ref,
      {
        id: listing.id,
        userId: listing.userId,
        tenantId: listing.tenantId,
        productId: listing.productId,
        offerId: listing.offerId,
        marketplaceSlug: listing.marketplaceSlug,
        externalId: listing.externalId ?? null,
        listingUrl: listing.listingUrl ?? null,
        status: listing.status,
        syncStatus: listing.syncStatus,
        price: listing.price,
        stock: listing.stock,
        externalData: listing.externalData ?? {},
        errorMessage: listing.errorMessage ?? null,
        publishedAt: listing.publishedAt ?? null,
        lastSyncAt: listing.lastSyncAt ?? null,
        createdAt: listing.createdAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}
