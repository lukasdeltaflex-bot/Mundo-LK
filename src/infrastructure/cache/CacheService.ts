import { MemoryCache } from './MemoryCache';
import { FirestoreExtractionCacheRepository } from '../firebase/repositories/firestore-extraction-cache.repository';
import { ProductExtractionResult } from '../../core/domain/entities/ProductExtractionResult';

export interface DifferentiatedCacheDoc {
  product: ProductExtractionResult;
  confidence: number;
  productCreatedAt: string;
  priceUpdatedAt: string;
  shippingUpdatedAt: string;
  couponUpdatedAt: string;
  ratingUpdatedAt: string;
}

export class CacheService {
  private memoryCache = MemoryCache.getInstance();
  private firestoreRepository = new FirestoreExtractionCacheRepository();

  private PRODUCT_TTL_MS = 24 * 60 * 60 * 1000;  // 24 Hours
  private PRICE_TTL_MS   = 30 * 60 * 1000;       // 30 Minutes
  private SHIPPING_TTL_MS= 30 * 60 * 1000;       // 30 Minutes
  private COUPON_TTL_MS  = 15 * 60 * 1000;       // 15 Minutes
  private RATING_TTL_MS  = 6 * 60 * 60 * 1000;   // 6 Hours

  public async getCachedProduct(productIdKey: string): Promise<{ product: ProductExtractionResult; confidence: number; isPriceStale: boolean; tier: 'L1_MEMORY' | 'L2_FIRESTORE' } | null> {
    const start = Date.now();

    // 1. L1 Memory Cache Check (< 10ms)
    const memoryHit = this.memoryCache.get<DifferentiatedCacheDoc>(productIdKey);
    if (memoryHit) {
      const isPriceStale = Date.now() - new Date(memoryHit.priceUpdatedAt).getTime() > this.PRICE_TTL_MS;
      console.log(`[Cache] ⚡ Hit L1 Memory Cache (${Date.now() - start}ms) para ${productIdKey}. Preço desatualizado? ${isPriceStale}`);
      return {
        product: memoryHit.product,
        confidence: memoryHit.confidence,
        isPriceStale,
        tier: 'L1_MEMORY',
      };
    }

    // 2. L2 Firestore Cache Check (< 100ms)
    const firestoreHit = await this.firestoreRepository.findByUrl(productIdKey);
    if (firestoreHit) {
      const now = Date.now();
      const productAge = now - new Date(firestoreHit.createdAt).getTime();

      if (productAge > this.PRODUCT_TTL_MS) {
        console.log(`[Cache] 🗑️ Cache L2 Firestore expirado (>24h) para ${productIdKey}`);
        return null;
      }

      const product = (firestoreHit as any).productData || (firestoreHit as any);
      const isPriceStale = now - new Date(firestoreHit.updatedAt).getTime() > this.PRICE_TTL_MS;

      // Populate L1 cache for subsequent fast hits
      const doc: DifferentiatedCacheDoc = {
        product,
        confidence: firestoreHit.confidence || 90,
        productCreatedAt: firestoreHit.createdAt,
        priceUpdatedAt: firestoreHit.updatedAt,
        shippingUpdatedAt: firestoreHit.updatedAt,
        couponUpdatedAt: firestoreHit.updatedAt,
        ratingUpdatedAt: firestoreHit.updatedAt,
      };
      this.memoryCache.set(productIdKey, doc, this.PRODUCT_TTL_MS);

      console.log(`[Cache] ⚡ Hit L2 Firestore Cache (${Date.now() - start}ms) para ${productIdKey}`);
      return {
        product,
        confidence: firestoreHit.confidence || 90,
        isPriceStale,
        tier: 'L2_FIRESTORE',
      };
    }

    console.log(`[Cache] ❌ Miss de Cache (${Date.now() - start}ms) para ${productIdKey}`);
    return null;
  }

  public async saveProductCache(productIdKey: string, product: ProductExtractionResult, confidence: number): Promise<void> {
    const nowIso = new Date().toISOString();
    const doc: DifferentiatedCacheDoc = {
      product,
      confidence,
      productCreatedAt: nowIso,
      priceUpdatedAt: nowIso,
      shippingUpdatedAt: nowIso,
      couponUpdatedAt: nowIso,
      ratingUpdatedAt: nowIso,
    };

    // Save to L1 Memory
    this.memoryCache.set(productIdKey, doc, this.PRODUCT_TTL_MS);

    // Save to L2 Firestore asynchronously
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.firestoreRepository.save({
      id: Buffer.from(productIdKey).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-20),
      url: product.originalUrl,
      normalizedUrl: productIdKey,
      marketplace: product.marketplace,
      productId: product.productId,
      title: product.title,
      description: product.description,
      price: product.currentPrice,
      oldPrice: product.originalPrice,
      currency: product.currency,
      discount: product.discountPercentage,
      image: product.image,
      images: product.gallery,
      brand: product.brand,
      category: product.category,
      seller: product.sellerName,
      rating: product.rating,
      reviews: product.reviewCount,
      sales: product.soldQuantity,
      shipping: product.shippingType,
      coupon: product.coupon,
      confidence,
      source: 'ExtractionEngine',
      createdAt: nowIso,
      updatedAt: nowIso,
      expiresAt: expiresAt.toISOString(),
      ...(product as any),
    } as any);

    console.log(`[Firestore] ✅ Cache salvo para ${productIdKey} (TTL 24h)`);
  }
}
