export interface ExtractionCacheDoc {
  id: string;             // Hash ou URL normalizada
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
  source: string;         // 'api', 'zenrows', 'parser'
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface IExtractionCacheRepository {
  findByUrl(normalizedUrl: string): Promise<ExtractionCacheDoc | null>;
  save(doc: ExtractionCacheDoc): Promise<void>;
  clearExpired(): Promise<void>;
}
