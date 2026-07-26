import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { fetchProductMetadata } from '../scraper/product-page-scraper';

/**
 * Adapter for Amazon Brasil Marketplace.
 * Extracts real product data from the page using HTML/JSON-LD scraping.
 * Includes Amazon Prime shipping metadata.
 */
export class AmazonAdapter implements IMarketplaceAdapter {
  public readonly marketplaceSlug: string = 'amazon';
  public readonly marketplaceName: string = 'Amazon Brasil';

  public canHandle(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('amazon.com.br') || lower.includes('amzn.to') || lower.includes('amazon.com');
  }

  public async extractProductData(url: string): Promise<ExtractedProductData> {
    const cleanUrl = url.trim();
    const metadata = await fetchProductMetadata(cleanUrl, this.marketplaceSlug);

    const hasValidTitle = metadata && metadata.title.length > 5;

    if (metadata && hasValidTitle) {
      return {
        title:           metadata.title,
        description:     metadata.description || `Produto disponível na ${this.marketplaceName}.`,
        brand:           metadata.brand || 'Amazon',
        categoryName:    metadata.category || 'Geral',
        mainImage:       metadata.image || '',
        gallery:         metadata.image ? [metadata.image] : [],
        currentPrice:    metadata.price ?? 0,
        previousPrice:   metadata.previousPrice ?? null,
        storeName:       'Amazon Oficial BR',
        storeReputation: 'Loja Oficial Amazon',
        shippingInfo:    'Frete Grátis com Amazon Prime',
        originalUrl:     cleanUrl,
        confidenceScore: metadata.confidenceScore,
        confidenceItems: metadata.confidenceItems,
      };
    }

    return {
      title:           '',
      description:     `Link de produto Amazon recebido: ${cleanUrl}`,
      brand:           'Não identificada',
      categoryName:    'Geral',
      mainImage:       '',
      gallery:         [],
      currentPrice:    0,
      previousPrice:   null,
      storeName:       this.marketplaceName,
      storeReputation: 'Loja Amazon',
      originalUrl:     cleanUrl,
      confidenceScore: 30, // Trigger <80% Safety Gate
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
    const cleanUrl = originalUrl.split('?')[0];
    return `${cleanUrl}?tag=${affiliateTag}`;
  }
}
