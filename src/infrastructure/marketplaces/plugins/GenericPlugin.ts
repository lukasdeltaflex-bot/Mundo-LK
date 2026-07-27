import { IMarketplacePlugin, MarketplaceCapabilities } from '../../../core/domain/ports/marketplaces/IMarketplacePlugin';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';
import { MARKETPLACE_CONFIG } from '../capabilities/CapabilityEngine';

export class GenericPlugin implements IMarketplacePlugin {
  public slug = 'generic';
  public name = 'Loja Online';

  public canHandle(_url: string): boolean {
    return true; // Universal fallback
  }

  public extractProductId(url: string): string | null {
    try {
      const hash = Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-16);
      return `gen_${hash}`;
    } catch {
      return `gen_${Date.now()}`;
    }
  }

  public getCapabilities(): MarketplaceCapabilities {
    return MARKETPLACE_CONFIG.generic;
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
      sellerName: raw.sellerName || '',
      sellerRating: raw.sellerRating || 0,
      shippingType: raw.shippingType || 'Envio Padrão',
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
      productId: raw.productId || this.extractProductId(canonicalUrl) || `gen_${Date.now()}`,
      canonicalUrl,
      originalUrl,
    };
  }
}
