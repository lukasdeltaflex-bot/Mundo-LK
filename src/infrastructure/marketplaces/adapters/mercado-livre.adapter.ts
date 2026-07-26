import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';

/**
 * Adapter for Mercado Livre Marketplace.
 * Encapsulates Mercado Livre URL matching, data extraction, and affiliate link generation.
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
    return {
      title: 'Fritadeira Eletrica Air Fryer Mondo 4L Inox 1500W Antiaderente',
      description: 'Air Fryer com capacidade de 4 litros, painel touch de alta precisão, controle de temperatura de 80°C a 200°C e cesto removível fácil de limpar.',
      brand: 'Mondo Home',
      categoryName: 'Eletrodomésticos & Cozinha',
      mainImage: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600',
      gallery: [
        'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600',
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600',
      ],
      currentPrice: 299.9,
      previousPrice: 499.9,
      storeName: 'Mercado Livre Eletrônicos Direct',
      storeReputation: 'MercadoLíder Platinum - 4.8 ★★★★★',
      reviewsRating: 4.8,
      originalUrl: cleanUrl,
    };
  }

  public async buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string> {
    const cleanUrl = originalUrl.split('?')[0];
    return `${cleanUrl}?matt_tool=${affiliateTag}&matt_word=affiliate_os`;
  }
}
