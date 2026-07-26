import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { fetchProductMetadata } from '../scraper/product-page-scraper';

/**
 * Adapter for Mercado Livre Marketplace.
 * Extracts real product data from the page using HTML/JSON-LD scraping.
 */
export class MercadoLivreAdapter implements IMarketplaceAdapter {
  public readonly marketplaceSlug: string = 'mercadolivre';
  public readonly marketplaceName: string = 'Mercado Livre';

  public canHandle(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('mercadolivre.com.br') || lower.includes('mercadolibre.com') || lower.includes('ml.br');
  }

  public async extractProductData(url: string): Promise<ExtractedProductData> {
    const cleanUrl = url.trim();
    const metadata = await fetchProductMetadata(cleanUrl, this.marketplaceSlug);

    if (metadata && metadata.confidence !== 'low' && metadata.title.length > 3) {
      return {
        title:           metadata.title,
        description:     metadata.description || `Produto disponível no ${this.marketplaceName}.`,
        brand:           metadata.brand || 'Desconhecida',
        categoryName:    metadata.category || undefined,
        mainImage:       metadata.image || '',
        gallery:         metadata.image ? [metadata.image] : [],
        currentPrice:    metadata.price ?? 0,
        previousPrice:   metadata.previousPrice ?? null,
        storeName:       this.marketplaceName,
        storeReputation: 'MercadoLíder',
        reviewsRating:   undefined,
        originalUrl:     cleanUrl,
      };
    }

    // Fallback: return placeholder so the workflow doesn't crash,
    // but signals that data could not be extracted
    console.warn(`[MercadoLivreAdapter] Could not extract real data from: ${cleanUrl}. Using title from URL slug.`);
    const slug = this.extractSlugFromUrl(cleanUrl);
    return {
      title:           slug || 'Produto Mercado Livre',
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

  private extractSlugFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const parts = pathname.split('/').filter(Boolean);
      // ML URLs: /MLB-123456789-produto-slug-_JM
      const slug = parts.find((p) => p.startsWith('MLB') || p.startsWith('MLB'))
        ?? parts[parts.length - 1];
      return slug ? slug.replace(/[-_]+/g, ' ').replace(/MLB\d+\s*/i, '').trim() : '';
    } catch {
      return '';
    }
  }

  public async buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string> {
    const cleanUrl = originalUrl.split('?')[0];
    return `${cleanUrl}?matt_tool=${affiliateTag}&matt_word=affiliate_os`;
  }
}
