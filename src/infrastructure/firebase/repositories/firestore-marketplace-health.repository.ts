import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import {
  MarketplaceHealth,
  MarketplaceHealthProps,
} from '../../../core/domain/entities/marketplace-health.entity';
import { MarketplaceConnectionSlug } from '../../../core/domain/entities/marketplace-connection.entity';

export class FirestoreMarketplaceHealthRepository {
  private collectionName = 'marketplace_health';

  public async findByUserIdAndSlug(
    userId: string,
    marketplaceSlug: MarketplaceConnectionSlug
  ): Promise<MarketplaceHealth | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('marketplaceSlug', '==', marketplaceSlug)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return new MarketplaceHealth(snap.docs[0].data() as MarketplaceHealthProps);
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreMarketplaceHealthRepository] findByUserIdAndSlug error:', err);
      return null;
    }
  }

  public async findAllByUserId(userId: string): Promise<MarketplaceHealth[]> {
    try {
      const q = query(collection(db, this.collectionName), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => new MarketplaceHealth(d.data() as MarketplaceHealthProps));
    } catch (err) {
      console.warn('[FirestoreMarketplaceHealthRepository] findAllByUserId error:', err);
      return [];
    }
  }

  public async save(health: MarketplaceHealth): Promise<void> {
    const docId = `health_${health.userId}_${health.marketplaceSlug}`;
    const ref = doc(db, this.collectionName, docId);
    await setDoc(
      ref,
      {
        id: docId,
        userId: health.userId,
        tenantId: health.tenantId,
        marketplaceSlug: health.marketplaceSlug,
        status: health.status,
        healthScore: health.healthScore,
        latencyMs: health.latencyMs,
        apiStatus: health.apiStatus,
        tokenStatus: health.tokenStatus,
        lastCheckedAt: health.lastCheckedAt,
        lastError: health.lastError ?? null,
      },
      { merge: true }
    );
  }
}
