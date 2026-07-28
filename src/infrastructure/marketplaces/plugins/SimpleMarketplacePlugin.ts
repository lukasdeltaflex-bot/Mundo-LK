import { IMarketplacePlugin, MarketplaceCapabilities } from '../../../core/domain/ports/marketplaces/IMarketplacePlugin';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

export class SimpleMarketplacePlugin implements IMarketplacePlugin {
  constructor(
    public slug: string,
    public name: string,
    private urlPattern: RegExp,
    private defaultShipping: string = 'Envio Padrão'
  ) {}

  public canHandle(url: string): boolean {
    return this.urlPattern.test(url);
  }

  public extractProductId(url: string): string | null {
    const match = url.match(/\/p\/([a-zA-Z0-9_-]+)/i) || url.match(/\/product\/([a-zA-Z0-9_-]+)/i) || url.match(/id=([a-zA-Z0-9_-]+)/i);
    return match ? `${this.slug}_${match[1]}` : null;
  }

  public getCapabilities(): MarketplaceCapabilities {
    return {
      hasPrime: false,
      hasFull: false,
      hasMall: false,
      hasCoins: false,
      hasStorePickup: false,
      hasCoupons: true,
      hasInstallments: true,
    };
  }

  public normalize(raw: Partial<ProductExtractionResult>, originalUrl: string, canonicalUrl: string): ProductExtractionResult {
    const title = raw.title?.trim() || `${this.name} Produto`;
    return {
      title,
      description: raw.description || `Produto oficial ${this.name} (${title})`,
      currentPrice: raw.currentPrice ?? null,
      originalPrice: raw.originalPrice ?? null,
      discountPercentage: raw.discountPercentage || 0,
      currency: raw.currency || 'BRL',
      brand: raw.brand || '',
      category: raw.category || 'Geral',
      subcategory: raw.subcategory || '',
      marketplace: this.slug,
      sellerName: raw.sellerName || '',
      sellerRating: raw.sellerRating || 0,
      shippingType: raw.shippingType || this.defaultShipping,
      shippingPrice: raw.shippingPrice ?? null,
      freeShipping: raw.freeShipping ?? false,
      prime: false,
      full: false,
      mall: false,
      coupon: raw.coupon || '',
      cashback: raw.cashback || '',
      installments: raw.installments || '',
      image: raw.image || '',
      gallery: raw.gallery || [],
      rating: raw.rating || 0,
      reviewCount: raw.reviewCount || 0,
      soldQuantity: raw.soldQuantity || '',
      productId: raw.productId || this.extractProductId(canonicalUrl) || `${this.slug}_${Date.now()}`,
      canonicalUrl,
      originalUrl,
    };
  }
}
