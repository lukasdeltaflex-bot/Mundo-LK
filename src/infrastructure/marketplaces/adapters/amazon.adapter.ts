import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';

/**
 * Adapter for Amazon Marketplace.
 * Encapsulates Amazon URL matching, data extraction, and affiliate link generation.
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
    return {
      title: 'Fone de Ouvido Bluetooth Sem Fio Noise Cancelling ANC 40h Bateria',
      description: 'Fone de Ouvido Over-Ear Bluetooth 5.3 com cancelamento ativo de ruído (ANC), bateria de longa duração com 40 horas de reprodução contínua.',
      brand: 'AudioTech',
      categoryName: 'Áudio & Acessórios',
      mainImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
      gallery: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600',
      ],
      currentPrice: 349.0,
      previousPrice: 599.0,
      storeName: 'Amazon Oficial BR',
      storeReputation: 'Loja Oficial Amazon - Entrega Prime',
      reviewsRating: 4.7,
      originalUrl: cleanUrl,
    };
  }

  public async buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string> {
    const cleanUrl = originalUrl.split('?')[0];
    return `${cleanUrl}?tag=${affiliateTag}`;
  }
}
