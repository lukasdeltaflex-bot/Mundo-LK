import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  limit,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import {
  MarketplaceSlug,
  MarketplaceTrend,
  MarketplaceTrendProps,
} from '../../../core/domain/entities/marketplace-trend.entity';

export class FirestoreMarketplaceTrendRepository {
  private collectionName = 'marketplace_trends';

  /**
   * Grava dados de tendência coletados.
   * Coleção protegida (leitura direta pelo cliente bloqueada por regras do Firestore).
   */
  public async save(trend: MarketplaceTrendProps): Promise<void> {
    try {
      const ref = doc(db, this.collectionName, trend.id);
      await setDoc(ref, {
        id: trend.id,
        marketplaceSlug: trend.marketplaceSlug,
        category: trend.category,
        keyword: trend.keyword,
        searchVolumeGrowthPct: trend.searchVolumeGrowthPct,
        avgPrice: trend.avgPrice,
        competitionLevel: trend.competitionLevel,
        collectedAt: trend.collectedAt,
        metadata: trend.metadata || {},
      });
    } catch (err) {
      console.warn('[FirestoreMarketplaceTrendRepository] save error:', err);
    }
  }

  /**
   * Uso exclusivo do backend/serviço interno — busca tendências por marketplace.
   */
  public async findLatestByMarketplace(
    marketplaceSlug: MarketplaceSlug,
    limitCount: number = 20
  ): Promise<MarketplaceTrend[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('marketplaceSlug', '==', marketplaceSlug),
        orderBy('collectedAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => new MarketplaceTrend(d.data() as MarketplaceTrendProps));
    } catch (err) {
      console.warn('[FirestoreMarketplaceTrendRepository] findLatestByMarketplace error:', err);
      return [];
    }
  }
}
