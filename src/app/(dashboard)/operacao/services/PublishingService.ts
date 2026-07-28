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
    const productId = extraction.productId || `prod_${Date.now()}`;
    const offerId = `offer_${Date.now()}`;

    // 1. Instancia a Entidade Dominial de Produto (ERP Single Source of Truth)
    const productProps: ProductProps = {
      id: productId,
      userId,
      title: extraction.title || 'Produto Sem Título',
      description: extraction.description || '',
      brand: extraction.brand || 'Geral',
      categoryId: extraction.category || 'Geral',
      marketplaceSlug: extraction.marketplace.toLowerCase(),
      originalUrl: extraction.originalUrl || extraction.canonicalUrl || 'https://shopee.com.br',
      affiliateUrl: AffiliateLink.create(extraction.canonicalUrl || extraction.originalUrl || 'https://shopee.com.br'),
      currentPrice: Price.create(extraction.currentPrice || 0),
      previousPrice: extraction.originalPrice ? Price.create(extraction.originalPrice) : null,
      discountPercentage: DiscountPercentage.create(extraction.discountPercentage || 0),
      images: extraction.image ? [extraction.image, ...(extraction.gallery || [])] : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const product = new Product(productProps);

    // 2. Instancia a Entidade Dominial de Oferta (Enriquecida com Copys de IA)
    const fullOfferProps: OfferProps = {
      id: offerId,
      productId,
      userId,
      scoreValue: offerProps.scoreValue || 90,
      scoreLabel: offerProps.scoreLabel || ('EXCELLENT' as any),
      scoreJustification: offerProps.scoreJustification || 'Oferta aprovada via Affiliate Operations Hub',
      copies: offerProps.copies!,
      hashtags: offerProps.hashtags || [],
      emojis: offerProps.emojis || ['🔥', '✨'],
      cta: offerProps.cta || 'Garanta o seu hoje!',
      aiProviderUsed: offerProps.aiProviderUsed || 'Gemini 2.5 Flash',
      createdAt: new Date(),
    };

    const offer = new Offer(fullOfferProps);

    // 3. Persistência real nos Repositórios Firestore do Mundo LK
    await this.productRepo.save(product);
    await this.offerRepo.save(offer);

    // 4. Publicação de Eventos no Barramento de Domínio (DomainEventBus)
    try {
      const eventBus = DomainEventBus.getInstance();
      await eventBus.publish(new OfferCreatedEvent(offer, product) as any);
    } catch (err) {
      console.warn('[PublishingService] Aviso ao publicar evento OfferCreatedEvent:', err);
    }

    return {
      product,
      offer,
      success: true,
    };
  }
}
