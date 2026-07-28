import { MarketplaceSlug, MarketplaceTrendProps } from '../entities/marketplace-trend.entity';

export interface FetchTrendsParams {
  category?: string;
  limit?: number;
}

export interface IMarketplaceTrendProvider {
  marketplaceSlug: MarketplaceSlug;
  fetchTopTrends(params?: FetchTrendsParams): Promise<MarketplaceTrendProps[]>;
}
