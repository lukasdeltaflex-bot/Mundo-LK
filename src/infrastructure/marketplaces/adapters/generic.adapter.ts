import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { fetchProductMetadata } from '../scraper/product-page-scraper';

/**
 * Fallback Adapter for any marketplace or web store URL.
 * Ensures the system can extract and analyze products from ANY URL.
 */
export class GenericMarketplaceAdapter implements IMarketplaceAdapter {
  public readonly marketplaceSlug: string = 'geral';
  public readonly marketplaceName: string = 'Loja Online';

  public canHandle(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.startsWith('http://') || lower.startsWith('https://');
  }

  public async extractProductData(url: string): Promise<ExtractedProductData> {
    const cleanUrl = url.trim();
    const metadata = await fetchProductMetadata(cleanUrl, this.marketplaceSlug);

    const domainName = this.extractDomain(cleanUrl);

    if (metadata && metadata.title.length > 5) {
      return {
        title:           metadata.title,
        description:     metadata.description || `Produto disponível em ${cleanUrl}`,
        brand:           metadata.brand || 'Desconhecida',
        categoryName:    metadata.category || 'Geral',
        mainImage:       metadata.image || '',
        gallery:         metadata.image ? [metadata.image] : [],
        currentPrice:    metadata.price ?? 0,
        previousPrice:   metadata.previousPrice ?? null,
        storeName:       domainName,
        originalUrl:     cleanUrl,
        confidenceScore: metadata.confidenceScore,
        confidenceItems: metadata.confidenceItems,
      };
    }

    return {
      title:           '',
      description:     `Link de produto de ${domainName} recebido: ${cleanUrl}`,
      brand:           'Não identificada',
      categoryName:    'Geral',
      mainImage:       '',
      gallery:         [],
      currentPrice:    0,
      previousPrice:   null,
      storeName:       domainName,
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

  private extractDomain(url: string): string {
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      return hostname.split('.')[0] || 'Loja Online';
    } catch {
      return 'Loja Online';
    }
  }

  public async buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string> {
    if (!affiliateTag) return originalUrl;
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}ref=${affiliateTag}`;
  }
}
