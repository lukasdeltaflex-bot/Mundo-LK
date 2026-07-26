import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { fetchProductMetadata } from '../scraper/product-page-scraper';

/**
 * Adapter for Shopee Marketplace.
 * Extracts real product data from the page using HTML/JSON-LD scraping.
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
    const cleanUrl = url.trim();
    const metadata = await fetchProductMetadata(cleanUrl, this.marketplaceSlug);

    if (metadata && metadata.confidence !== 'low' && metadata.title.length > 3) {
      return {
        title:           metadata.title,
        description:     metadata.description || `Produto disponível na ${this.marketplaceName}.`,
        brand:           metadata.brand || 'Desconhecida',
        categoryName:    metadata.category || undefined,
        mainImage:       metadata.image || '',
        gallery:         metadata.image ? [metadata.image] : [],
        currentPrice:    metadata.price ?? 0,
        previousPrice:   metadata.previousPrice ?? null,
        storeName:       this.marketplaceName,
        storeReputation: 'Loja Shopee',
        reviewsRating:   undefined,
        originalUrl:     cleanUrl,
      };
    }

    console.warn(`[ShopeeAdapter] Could not extract real data from: ${cleanUrl}.`);
    return {
      title:           'Produto Shopee',
      description:     'Descrição não disponível. Verifique o link do produto.',
      brand:           'Desconhecida',
      categoryName:    undefined,
      mainImage:       '',
      gallery:         [],
      currentPrice:    0,
      previousPrice:   null,
      storeName:       this.marketplaceName,
      storeReputation: undefined,
      reviewsRating:   undefined,
      originalUrl:     cleanUrl,
    };
  }

  public async buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string> {
    const cleanUrl = originalUrl.split('?')[0];
    return `${cleanUrl}?utm_source=affiliate&af_siteid=${affiliateTag}&af_click_lookback=7d`;
  }
}
