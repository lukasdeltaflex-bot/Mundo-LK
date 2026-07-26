import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { fetchProductMetadata } from '../scraper/product-page-scraper';

/**
 * Adapter for Magazine Luiza (Magalu) Marketplace.
 * Extracts real product data from the page using HTML/JSON-LD scraping.
 * Includes Retira na Loja & Cashback MagaluPay metadata.
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

    const hasValidTitle = metadata && metadata.title.length > 5;

    if (metadata && hasValidTitle) {
      return {
        title:           metadata.title,
        description:     metadata.description || `Produto disponível na ${this.marketplaceName}.`,
        brand:           metadata.brand || 'Magalu',
        categoryName:    metadata.category || 'Geral',
        mainImage:       metadata.image || '',
        gallery:         metadata.image ? [metadata.image] : [],
        currentPrice:    metadata.price ?? 0,
        previousPrice:   metadata.previousPrice ?? null,
        storeName:       'Magazine Luiza Oficial',
        storeReputation: 'Magalu — Loja Oficial',
        shippingInfo:    'Retirada Rápida na Loja + MagaluPay',
        originalUrl:     cleanUrl,
        confidenceScore: metadata.confidenceScore,
        confidenceItems: metadata.confidenceItems,
      };
    }

    return {
      title:           '',
      description:     `Link de produto Magalu recebido: ${cleanUrl}`,
      brand:           'Não identificada',
      categoryName:    'Geral',
      mainImage:       '',
      gallery:         [],
      currentPrice:    0,
      previousPrice:   null,
      storeName:       this.marketplaceName,
      storeReputation: 'Loja Magalu',
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
    return `${cleanUrl}?partner_id=${affiliateTag}`;
  }
}
