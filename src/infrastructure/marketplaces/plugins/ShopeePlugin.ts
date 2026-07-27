import { IMarketplacePlugin, MarketplaceCapabilities } from '../../../core/domain/ports/marketplaces/IMarketplacePlugin';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';
import { MARKETPLACE_CONFIG } from '../capabilities/CapabilityEngine';

export class ShopeePlugin implements IMarketplacePlugin {
  public slug = 'shopee';
  public name = 'Shopee';

  public canHandle(url: string): boolean {
    return /shopee\.com\.br|shope\.ee|shp\.ee|s\.shopee\.com\.br/i.test(url);
  }

  public extractProductId(url: string): string | null {
    const m = url.match(/i\.(\d+\.\d+)/i) || url.match(/-i\.(\d+)\.(\d+)/i) || url.match(/\/(\d+)\/(\d+)/);
    if (m) {
      if (m[2]) return `shopee_${m[1]}_${m[2]}`;
      return `shopee_${m[1]}`;
    }
    return null;
  }

  public extractTitleFromUrlSlug(url: string): string {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      // Shopee URL patterns: /product-title-slug-i.shopid.itemid OR /product-title-slug/shopid/itemid
      const slugSegment = parts.find(p => !/^\d+$/.test(p) && p.length > 2 && !p.startsWith('shopee')) || parts[0] || '';
      
      const cleaned = slugSegment
        .replace(/-i\.\d+\.\d+$/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/%[0-9A-F]{2}/gi, ' ')
        .trim();

      if (/^\d+$/.test(cleaned)) return '';
      return cleaned.length > 2 ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : '';
    } catch {
      return '';
    }
  }

  public getCapabilities(): MarketplaceCapabilities {
    return MARKETPLACE_CONFIG.shopee;
  }

  public normalize(raw: Partial<ProductExtractionResult>, originalUrl: string, canonicalUrl: string): ProductExtractionResult {
    const caps = this.getCapabilities();
    const fallbackTitle = this.extractTitleFromUrlSlug(canonicalUrl) || this.extractTitleFromUrlSlug(originalUrl);
    const title = raw.title && raw.title.trim().length > 3 ? raw.title.trim() : fallbackTitle;

    return {
      title,
      description: raw.description || `Produto oficial Shopee (${title})`,
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
      shippingType: raw.shippingType || 'Envio Padrão Shopee',
      shippingPrice: raw.shippingPrice ?? null,
      freeShipping: raw.freeShipping ?? false,
      prime: false,
      full: false,
      mall: raw.mall ?? caps.hasMall,
      coupon: raw.coupon || '',
      cashback: raw.cashback || '',
      installments: raw.installments || '',
      image: raw.image || '',
      gallery: raw.gallery || [],
      rating: raw.rating || 0,
      reviewCount: raw.reviewCount || 0,
      soldQuantity: raw.soldQuantity || '',
      productId: raw.productId || this.extractProductId(canonicalUrl) || `shopee_${Date.now()}`,
      canonicalUrl,
      originalUrl,
    };
  }
}
