import { Product, ProductProps } from '@/core/domain/entities/product.entity';
import { Offer, OfferProps } from '@/core/domain/entities/offer.entity';
import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';
import { Price, DiscountPercentage, AffiliateLink } from '@/core/domain/value-objects';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { DomainEventBus } from '@/core/domain/events/DomainEventBus';
import { OfferCreatedEvent } from '@/core/domain/events/OfferCreatedEvent';

export interface SaveOfferResult {
  product: Product;
  offer: Offer;
  success: boolean;
}

export class PublishingService {
  private productRepo = new FirestoreProductRepository();
  private offerRepo = new FirestoreOfferRepository();

  /**
   * Saves Product and Offer to Firestore and dispatches Domain Events.
   */
  public async saveProductAndOffer(
    extraction: ProductExtractionResult,
    offerProps: Partial<OfferProps>,
    userId: string
  ): Promise<SaveOfferResult> {
    // 1. Garantir um productId único por criação para evitar que a chave de marketplace sobrescreva produtos anteriores
    const uniqueProductId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const productProps: ProductProps = {
      id: uniqueProductId,
      userId,
      title: extraction.title || 'Produto Sem Título',
      description: extraction.description || '',
      brand: extraction.brand || 'Geral',
      categoryId: extraction.category || 'Geral',
      marketplaceSlug: extraction.marketplace ? extraction.marketplace.toLowerCase() : 'shopee',
      originalUrl: extraction.originalUrl || extraction.canonicalUrl || 'https://shopee.com.br',
      affiliateUrl: AffiliateLink.create(extraction.originalUrl || extraction.canonicalUrl || 'https://shopee.com.br'),
      currentPrice: Price.create(extraction.currentPrice || 0),
      previousPrice: extraction.originalPrice ? Price.create(extraction.originalPrice) : null,
      discountPercentage: DiscountPercentage.create(extraction.discountPercentage || 0),
      images: extraction.image ? [extraction.image, ...(extraction.gallery || [])] : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const product = new Product(productProps);
    await this.productRepo.save(product);

    // 2. Delegar a criação da Oferta ao CreateOfferUseCase (com ID de negócio amigável OFF-YYYYMMDD-XXXX e sem merge: true)
    const { CreateOfferUseCase } = await import('@/core/application/use-cases/offers/CreateOfferUseCase');
    const createOfferUseCase = new CreateOfferUseCase(this.offerRepo, this.productRepo);

    const offer = await createOfferUseCase.execute({
      product,
      userId,
      scoreValue: offerProps.scoreValue || 90,
      scoreLabel: offerProps.scoreLabel || ('EXCELLENT' as any),
      scoreJustification: offerProps.scoreJustification || 'Oferta aprovada via Affiliate Operations Hub',
      copies: offerProps.copies!,
      hashtags: offerProps.hashtags || [],
      emojis: offerProps.emojis || ['🔥', '✨'],
      cta: offerProps.cta || 'Garanta o seu hoje!',
      aiProviderUsed: offerProps.aiProviderUsed || 'Gemini 2.5 Flash',
      marketplaceId: extraction.marketplace ? extraction.marketplace.toLowerCase() : 'shopee',
      marketplaceName: extraction.marketplace || 'Shopee',
      marketplaceDetectedBy: 'url_parser',
    });

    console.log('[AUDIT EXECUTION] Product and Offer Saved:', {
      offerId: offer.id,
      productId: product.id,
      marketplace: product.marketplaceSlug,
      originalUrl: product.originalUrl,
    });

    return {
      product,
      offer,
      success: true,
    };
  }
}
