import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
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
  MarketplaceConnection,
  MarketplaceConnectionProps,
  MarketplaceConnectionSlug,
} from '../../../core/domain/entities/marketplace-connection.entity';
import { PaginationResult } from '../../../core/domain/value-objects/PaginationResult';

export class FirestoreMarketplaceConnectionRepository {
  private collectionName = 'marketplace_connections';

  public async findById(id: string): Promise<MarketplaceConnection | null> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return new MarketplaceConnection(snap.data() as MarketplaceConnectionProps);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreMarketplaceConnectionRepository] findById error:', err);
      return null;
    }
  }

  public async findByUserIdAndSlug(
    userId: string,
    marketplaceSlug: MarketplaceConnectionSlug
  ): Promise<MarketplaceConnection | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('marketplaceSlug', '==', marketplaceSlug),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.docs.length > 0) {
        return new MarketplaceConnection(snap.docs[0].data() as MarketplaceConnectionProps);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreMarketplaceConnectionRepository] findByUserIdAndSlug error:', err);
      return null;
    }
  }

  public async findAllByUserId(userId: string): Promise<MarketplaceConnection[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => new MarketplaceConnection(d.data() as MarketplaceConnectionProps));
    } catch (err) {
      console.warn('[FirestoreMarketplaceConnectionRepository] findAllByUserId error:', err);
      return [];
    }
  }

  public async findPagedByUserId(
    userId: string,
    pageSize: number = 20,
    lastDocSnap?: QueryDocumentSnapshot
  ): Promise<PaginationResult<MarketplaceConnection>> {
    try {
      const constraints: any[] = [
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(pageSize),
      ];
      if (lastDocSnap) constraints.push(startAfter(lastDocSnap));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => new MarketplaceConnection(d.data() as MarketplaceConnectionProps));
      const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;

      return { items, cursor, hasMore: snap.docs.length === pageSize };
    } catch (err) {
      console.warn('[FirestoreMarketplaceConnectionRepository] findPagedByUserId error:', err);
      return { items: [], hasMore: false };
    }
  }

  public async save(connection: MarketplaceConnection): Promise<void> {
    const ref = doc(db, this.collectionName, connection.id);
    await setDoc(
      ref,
      {
        id: connection.id,
        userId: connection.userId,
        tenantId: connection.tenantId,
        marketplaceSlug: connection.marketplaceSlug,
        storeName: connection.storeName ?? null,
        accountId: connection.accountId ?? null,
        status: connection.status,
        credentials: connection.credentials,
        source: connection.source,
        lastSyncAt: connection.lastSyncAt ?? null,
        lastTestedAt: connection.lastTestedAt ?? null,
        lastError: connection.lastError ?? null,
        createdAt: connection.createdAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  public async delete(id: string): Promise<void> {
    const ref = doc(db, this.collectionName, id);
    await deleteDoc(ref);
  }
}
