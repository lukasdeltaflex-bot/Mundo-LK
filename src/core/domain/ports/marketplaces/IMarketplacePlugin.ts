import { ProductExtractionResult } from '../../entities/ProductExtractionResult';

export interface MarketplaceCapabilities {
  hasPrime: boolean;
  hasFull: boolean;
  hasMall: boolean;
  hasCoins: boolean;
  hasStorePickup: boolean;
  hasCoupons: boolean;
  hasInstallments: boolean;
}

export interface IMarketplacePlugin {
  slug: string;
  name: string;
  canHandle(url: string): boolean;
  extractProductId(url: string): string | null;
  getCapabilities(): MarketplaceCapabilities;
  normalize(raw: Partial<ProductExtractionResult>, originalUrl: string, canonicalUrl: string): ProductExtractionResult;
}
