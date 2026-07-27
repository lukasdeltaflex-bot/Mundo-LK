export interface ConfidenceCheckItem {
  label: string;
  found: boolean;
  weight: number;
}

export interface ExtractedProductData {
  title: string;
  description: string;
  brand: string;
  categoryName?: string;
  subCategoryName?: string;
  mainImage: string;
  gallery: string[];
  currentPrice: number;
  previousPrice?: number | null;
  discountPercentage?: number;
  storeName: string;
  storeReputation?: string;
  reviewsRating?: number;
  reviewsCount?: number;
  salesCount?: string;
  shippingInfo?: string;
  couponInfo?: string;
  sellerName?: string;
  originalUrl: string;
  confidenceScore: number; // 0 to 100
  confidenceMode?: 'automatic' | 'assisted' | 'manual';
  confidenceItems: ConfidenceCheckItem[];
}

export interface IMarketplaceAdapter {
  readonly marketplaceSlug: string;
  readonly marketplaceName: string;
  canHandle(url: string): boolean;
  extractProductData(url: string): Promise<ExtractedProductData>;
  buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string>;
}
