import { IMarketplacePlugin, MarketplaceCapabilities } from '../../../core/domain/ports/marketplaces/IMarketplacePlugin';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';
import { MARKETPLACE_CONFIG } from '../capabilities/CapabilityEngine';

export class AmazonPlugin implements IMarketplacePlugin {
  public slug = 'amazon';
  public name = 'Amazon';

  public canHandle(url: string): boolean {
    return /amazon\.com\.br|amazon\.com|amzn\.to/i.test(url);
  }

  public extractProductId(url: string): string | null {
    const m = url.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})/i) || url.match(/\/([A-Z0-9]{10})(\/|\?|$)/i);
    if (m?.[2]) return `asin_${m[2]}`;
    if (m?.[1] && m[1].length === 10) return `asin_${m[1]}`;
    return null;
  }

  public getCapabilities(): MarketplaceCapabilities {
    return MARKETPLACE_CONFIG.amazon;
  }

  public normalize(raw: Partial<ProductExtractionResult>, originalUrl: string, canonicalUrl: string): ProductExtractionResult {
    const caps = this.getCapabilities();
    return {
      title: raw.title || '',
      description: raw.description || '',
      currentPrice: raw.currentPrice ?? null,
      originalPrice: raw.originalPrice ?? null,
      discountPercentage: raw.discountPercentage || 0,
      currency: raw.currency || 'BRL',
      brand: raw.brand || '',
      category: raw.category || 'Geral',
      subcategory: raw.subcategory || '',
      marketplace: this.slug,
      sellerName: raw.sellerName || 'Amazon',
      sellerRating: raw.sellerRating || 0,
      shippingType: raw.shippingType || (raw.prime ? 'Frete Grátis Prime' : 'Envio Padrão'),
      shippingPrice: raw.shippingPrice ?? null,
      freeShipping: raw.freeShipping ?? false,
      prime: raw.prime ?? caps.hasPrime,
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
      productId: raw.productId || this.extractProductId(canonicalUrl) || `amazon_${Date.now()}`,
      canonicalUrl,
      originalUrl,
    };
  }
}
