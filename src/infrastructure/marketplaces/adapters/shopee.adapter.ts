import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { fetchProductMetadata } from '../scraper/product-page-scraper';

/**
 * Adapter for Shopee Marketplace.
 * Extracts real product data from the page using HTML/JSON-LD scraping.
 * Guarantees zero fake product fallbacks.
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

    const hasValidTitle = metadata && metadata.title.length > 5 && !/mkt\s*single\s*page|error_page|shopecdn/i.test(metadata.title);

    if (metadata && hasValidTitle) {
      return {
        title:           metadata.title,
        description:     metadata.description || `Produto disponível na ${this.marketplaceName}.`,
        brand:           metadata.brand || 'Desconhecida',
        categoryName:    metadata.category || 'Geral',
        mainImage:       metadata.image || '',
        gallery:         metadata.image ? [metadata.image] : [],
        currentPrice:    metadata.price ?? 0,
        previousPrice:   metadata.previousPrice ?? null,
        storeName:       this.marketplaceName,
        storeReputation: 'Loja Shopee',
        originalUrl:     cleanUrl,
        confidenceScore: metadata.confidenceScore,
        confidenceItems: metadata.confidenceItems,
      };
    }

    // Unverified link fallback: Low confidence score (<80%) to trigger manual confirmation screen
    return {
      title:           '',
      description:     `Link de produto Shopee recebido: ${cleanUrl}`,
      brand:           'Não identificada',
      categoryName:    'Geral',
      mainImage:       '',
      gallery:         [],
      currentPrice:    0,
      previousPrice:   null,
      storeName:       this.marketplaceName,
      storeReputation: 'Loja Shopee',
      originalUrl:     cleanUrl,
      confidenceScore: 35, // Trigger <80% Safety Gate
      confidenceItems: [
        { label: 'Título oficial do anúncio', found: false, weight: 30 },
        { label: 'Preço atual', found: false, weight: 25 },
        { label: 'Imagem principal do produto', found: false, weight: 20 },
        { label: 'Categoria ou Marca', found: false, weight: 15 },
        { label: 'Descrição / Detalhes', found: false, weight: 10 },
      ],
    };
  }

  public async buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string> {
    if (!affiliateTag || originalUrl.includes('s.shopee.com.br') || originalUrl.includes('shope.ee')) {
      return originalUrl;
    }
    const cleanUrl = originalUrl.split('?')[0];
    return `${cleanUrl}?utm_source=affiliate&af_siteid=${affiliateTag}&af_click_lookback=7d`;
  }
}
