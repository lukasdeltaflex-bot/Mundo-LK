import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';

/**
 * Adapter for Shopee Marketplace.
 * Encapsulates Shopee URL matching, data extraction, and affiliate link generation.
 */
export class ShopeeAdapter implements IMarketplaceAdapter {
  public readonly marketplaceSlug: string = 'shopee';
  public readonly marketplaceName: string = 'Shopee Brasil';

  public canHandle(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('shopee.com.br') || lower.includes('shope.ee') || lower.includes('shp.ee');
  }

  public async extractProductData(url: string): Promise<ExtractedProductData> {
    // Structural parser simulating extraction engine
    const cleanUrl = url.trim();
    return {
      title: 'Smartphone Xiaomi Redmi Note 13 256GB 8GB RAM Tela 6.67 Full HD',
      description: 'Smartphone Xiaomi Redmi Note 13 com processador Snapdragon 685, câmera tripla de 108MP, bateria de 5000mAh e carregamento rápido de 33W.',
      brand: 'Xiaomi',
      categoryName: 'Eletrônicos & Celulares',
      mainImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
      gallery: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
        'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600',
      ],
      currentPrice: 1199.0,
      previousPrice: 1899.0,
      storeName: 'Xiaomi Oficial Shopee',
      storeReputation: 'Loja Oficial - 4.9 ★★★★★',
      reviewsRating: 4.9,
      originalUrl: cleanUrl,
    };
  }

  public async buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string> {
    const cleanUrl = originalUrl.split('?')[0];
    return `${cleanUrl}?utm_source=affiliate&af_siteid=${affiliateTag}&af_click_lookback=7d`;
  }
}
