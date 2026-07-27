import { IMarketplacePlugin, MarketplaceCapabilities } from '../../../core/domain/ports/marketplaces/IMarketplacePlugin';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';
import { MARKETPLACE_CONFIG } from '../capabilities/CapabilityEngine';

export class MagaluPlugin implements IMarketplacePlugin {
  public slug = 'magalu';
  public name = 'Magalu';

  public canHandle(url: string): boolean {
    return /magazineluiza\.com\.br|magalu\.com|magazinevoce\.com\.br/i.test(url);
  }

  public extractProductId(url: string): string | null {
    const m = url.match(/\/p\/([a-z0-9]+)/i);
    if (m) return `magalu_${m[1]}`;
    return null;
  }

  public getCapabilities(): MarketplaceCapabilities {
    return MARKETPLACE_CONFIG.magalu;
  }

  public normalize(raw: Partial<ProductExtractionResult>, originalUrl: string, canonicalUrl: string): ProductExtractionResult {
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
      sellerName: raw.sellerName || 'Magalu',
      sellerRating: raw.sellerRating || 0,
      shippingType: raw.shippingType || 'Retira na Loja / Envio Padrão',
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
      productId: raw.productId || this.extractProductId(canonicalUrl) || `magalu_${Date.now()}`,
      canonicalUrl,
      originalUrl,
    };
  }
}
