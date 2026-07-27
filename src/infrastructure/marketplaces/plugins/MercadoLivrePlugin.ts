import { IMarketplacePlugin, MarketplaceCapabilities } from '../../../core/domain/ports/marketplaces/IMarketplacePlugin';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';
import { MARKETPLACE_CONFIG } from '../capabilities/CapabilityEngine';

export class MercadoLivrePlugin implements IMarketplacePlugin {
  public slug = 'mercado-livre';
  public name = 'Mercado Livre';

  public canHandle(url: string): boolean {
    return /mercadolivre\.com\.br|mercadolibre\.com|ml\.br|mercadolivre\.page\.link/i.test(url);
  }

  public extractProductId(url: string): string | null {
    const m = url.match(/(MLB-?\d+)/i);
    if (m) return m[1].replace('-', '').toUpperCase();
    return null;
  }

  public getCapabilities(): MarketplaceCapabilities {
    return MARKETPLACE_CONFIG['mercado-livre'];
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
      sellerName: raw.sellerName || '',
      sellerRating: raw.sellerRating || 0,
      shippingType: raw.shippingType || (raw.full ? 'Envio FULL' : 'Envio Padrão'),
      shippingPrice: raw.shippingPrice ?? null,
      freeShipping: raw.freeShipping ?? false,
      prime: false,
      full: raw.full ?? caps.hasFull,
      mall: false,
      coupon: raw.coupon || '',
      cashback: raw.cashback || '',
      installments: raw.installments || '',
      image: raw.image || '',
      gallery: raw.gallery || [],
      rating: raw.rating || 0,
      reviewCount: raw.reviewCount || 0,
      soldQuantity: raw.soldQuantity || '',
      productId: raw.productId || this.extractProductId(canonicalUrl) || `ml_${Date.now()}`,
      canonicalUrl,
      originalUrl,
    };
  }
}
