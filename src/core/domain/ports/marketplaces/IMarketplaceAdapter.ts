export interface ExtractedProductData {
  title: string;
  description: string;
  brand: string;
  categoryName?: string;
  mainImage: string;
  gallery: string[];
  currentPrice: number;
  previousPrice?: number | null;
  storeName: string;
  storeReputation?: string;
  reviewsRating?: number;
  originalUrl: string;
}

export interface IMarketplaceAdapter {
  readonly marketplaceSlug: string;
  readonly marketplaceName: string;
  canHandle(url: string): boolean;
  extractProductData(url: string): Promise<ExtractedProductData>;
  buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string>;
}
