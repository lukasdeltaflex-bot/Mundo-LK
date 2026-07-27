export interface ExtractedData {
  url: string;
  normalizedUrl: string;
  marketplace: string;
  productId: string;
  title: string;
  description: string;
  price: number | null;
  oldPrice: number | null;
  currency: string;
  discount: number;
  image: string;
  images: string[];
  brand: string;
  category: string;
  seller: string;
  rating: number;
  reviews: number;
  sales: string;
  shipping: string;
  coupon: string;
  confidence: number;
  source: string; // e.g. 'ML_API', 'ZenRows', 'Cache'
}

export interface IExtractionProvider {
  /**
   * Identifies if this provider can handle the given URL and marketplace.
   */
  canHandle(marketplaceSlug: string, url: string): boolean;

  /**
   * Attempts to extract product data.
   * Should return null if extraction fails or is blocked, allowing the engine to fallback.
   */
  extract(url: string, marketplaceSlug: string): Promise<ExtractedData | null>;
}
