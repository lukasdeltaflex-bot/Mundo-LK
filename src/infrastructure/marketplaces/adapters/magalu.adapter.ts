import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { fetchProductMetadata } from '../scraper/product-page-scraper';

/**
 * Adapter for Magazine Luiza (Magalu) Marketplace.
 * Extracts real product data from the page using HTML/JSON-LD scraping.
 */
export class MagaluAdapter implements IMarketplaceAdapter {
  public readonly marketplaceSlug: string = 'magalu';
  public readonly marketplaceName: string = 'Magazine Luiza';

  public canHandle(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('magazineluiza.com.br') || lower.includes('magalu.com');
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
        storeName:       'Magazine Luiza Oficial',
        storeReputation: 'Magalu — Loja Oficial',
        reviewsRating:   undefined,
        originalUrl:     cleanUrl,
      };
    }

    console.warn(`[MagaluAdapter] Could not extract real data from: ${cleanUrl}.`);
    return {
      title:           'Produto Magalu',
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
    return `${cleanUrl}?partner_id=${affiliateTag}`;
  }
}
