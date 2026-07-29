import { MarketplaceConnectionSlug } from '../entities/marketplace-connection.entity';

export interface MarketplacePublishPayload {
  title: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  affiliateUrl: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface MarketplacePublishResult {
  success: boolean;
  externalId?: string;
  listingUrl?: string;
  error?: string;
  rawResponse?: Record<string, unknown>;
}

export interface IMarketplacePublisher {
  marketplaceSlug: MarketplaceConnectionSlug;
  publish(payload: MarketplacePublishPayload): Promise<MarketplacePublishResult>;
  pauseListing?(externalId: string): Promise<boolean>;
}
