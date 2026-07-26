import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';

/**
 * Adapter for Magazine Luiza (Magalu) Marketplace.
 * Encapsulates Magalu URL matching, data extraction, and affiliate link generation.
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
    return {
      title: 'Smart TV 55 polegadas 4K UHD Wi-Fi Bluetooth HDR10 Comando de Voz',
      description: 'Smart TV 55 4K UHD com processador Crystal 4K, design sem bordas, inteligência artificial e conectividade total.',
      brand: 'Samsung',
      categoryName: 'TVs & Smart Display',
      mainImage: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600',
      gallery: [
        'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600',
        'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600',
      ],
      currentPrice: 2499.0,
      previousPrice: 3299.0,
      storeName: 'Magazine Luiza Oficial',
      storeReputation: 'Magalu Entregador Oficial - 4.9 ★★★★★',
      reviewsRating: 4.9,
      originalUrl: cleanUrl,
    };
  }

  public async buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string> {
    const cleanUrl = originalUrl.split('?')[0];
    return `${cleanUrl}?partner_id=${affiliateTag}`;
  }
}
