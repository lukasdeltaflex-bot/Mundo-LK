import { MarketplaceSlug, OfferProductData, OfferPricing, OfferCommission } from '../entities/affiliate-offer.entity';

export interface RawMarketplaceExtractionResult {
  marketplace: MarketplaceSlug;
  marketplaceItemId: string;
  originalUrl: string;
  productData: OfferProductData;
  pricing: OfferPricing;
  commission: OfferCommission;
  rawResponse?: Record<string, unknown>;
}

export interface IMarketplaceProvider {
  marketplaceSlug: MarketplaceSlug;
  extractOfferData(url: string): Promise<RawMarketplaceExtractionResult>;
}
