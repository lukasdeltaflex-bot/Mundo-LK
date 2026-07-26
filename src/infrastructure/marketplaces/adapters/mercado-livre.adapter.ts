import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { fetchProductMetadata } from '../scraper/product-page-scraper';

/**
 * Adapter for Mercado Livre Marketplace.
 * Extracts real product data from the page using HTML/JSON-LD scraping.
 * Includes FULL shipping & installments information.
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

    const hasValidTitle = metadata && metadata.title.length > 5;

    if (metadata && hasValidTitle) {
      return {
        title:           metadata.title,
        description:     metadata.description || `Produto disponível no ${this.marketplaceName}.`,
        brand:           metadata.brand || 'Desconhecida',
        categoryName:    metadata.category || 'Geral',
        mainImage:       metadata.image || '',
        gallery:         metadata.image ? [metadata.image] : [],
        currentPrice:    metadata.price ?? 0,
        previousPrice:   metadata.previousPrice ?? null,
        storeName:       this.marketplaceName,
        storeReputation: 'MercadoLíder Platinum',
        shippingInfo:    'Mercado Envios FULL (Entrega Rápida)',
        originalUrl:     cleanUrl,
        confidenceScore: metadata.confidenceScore,
        confidenceItems: metadata.confidenceItems,
      };
    }

    const slug = this.extractSlugFromUrl(cleanUrl);
    return {
      title:           slug || '',
      description:     `Link de produto Mercado Livre recebido: ${cleanUrl}`,
      brand:           'Não identificada',
      categoryName:    'Geral',
      mainImage:       '',
      gallery:         [],
      currentPrice:    0,
      previousPrice:   null,
      storeName:       this.marketplaceName,
      storeReputation: 'Vendedor Mercado Livre',
      originalUrl:     cleanUrl,
      confidenceScore: slug ? 55 : 30, // Trigger <80% Safety Gate if unverified
      confidenceItems: [
        { label: 'Título oficial do anúncio', found: !!slug, weight: 30 },
        { label: 'Preço atual', found: false, weight: 25 },
        { label: 'Imagem principal do produto', found: false, weight: 20 },
        { label: 'Categoria ou Marca', found: false, weight: 15 },
        { label: 'Descrição / Detalhes', found: false, weight: 10 },
      ],
    };
  }

  private extractSlugFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const parts = pathname.split('/').filter(Boolean);
      const slug = parts.find((p) => p.startsWith('MLB')) ?? parts[parts.length - 1];
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
