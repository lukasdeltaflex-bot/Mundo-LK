import { MagaluDiscoveryProvider } from '../../../../infrastructure/marketplaces/discovery/MagaluDiscoveryProvider';
import { ProductExtractionResult } from '../../../domain/entities/ProductExtractionResult';

export interface DiscoverMagaluInputDTO {
  limit?: number;
  feedUrl?: string;
}

export class DiscoverMagaluOffersUseCase {
  private provider = new MagaluDiscoveryProvider();

  public async execute(input?: DiscoverMagaluInputDTO): Promise<ProductExtractionResult[]> {
    console.log(`[DiscoverMagaluOffersUseCase] 🚀 Iniciando execução de descoberta de ofertas do Magalu...`);
    const results = await this.provider.discover({
      limit: input?.limit || 20,
      feedUrl: input?.feedUrl,
    });

    // Mapeia DiscoveryResult[] para ProductExtractionResult[] para compatibilidade direta com a UI e PublishingService
    const extractions: ProductExtractionResult[] = results.map((r) => ({
      title: r.title,
      description: `Produto em destaque no Magazine Luiza.`,
      currentPrice: r.currentPrice,
      originalPrice: r.previousPrice ?? null,
      discountPercentage: r.previousPrice && r.currentPrice ? Math.round(((r.previousPrice - r.currentPrice) / r.previousPrice) * 100) : 0,
      currency: 'BRL',
      brand: 'Magalu',
      category: 'Geral',
      subcategory: 'Geral',
      marketplace: 'magalu',
      sellerName: 'Magazine Luiza',
      sellerRating: 4.8,
      shippingType: 'Padrão',
      shippingPrice: 0,
      freeShipping: true,
      prime: false,
      full: false,
      mall: false,
      coupon: '',
      cashback: '',
      installments: '',
      image: r.image,
      gallery: [r.image],
      rating: 4.8,
      reviewCount: 150,
      soldQuantity: '100+',
      productId: r.marketplaceProductId || `magalu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      canonicalUrl: r.originalUrl,
      originalUrl: r.originalUrl,
    }));

    return extractions;
  }
}
