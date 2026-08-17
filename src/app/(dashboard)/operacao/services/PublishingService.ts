import { Product, ProductProps, ProductMedia } from '@/core/domain/entities/product.entity';
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
    const rawUrl = extraction.originalUrl || extraction.canonicalUrl || 'https://shopee.com.br';

    // 1. Product Matching Waterfall: Busca se o produto já existe no catálogo do usuário pela URL
    let existingProduct: Product | null = null;
    try {
      if (rawUrl && rawUrl.length > 10) {
        existingProduct = await this.productRepo.findByOriginalUrl(rawUrl, userId);
      }
    } catch (err) {
      console.warn('[PublishingService] Erro ao buscar produto existente:', err);
    }

    let product: Product;
    if (existingProduct) {
      product = existingProduct;
      if (extraction.currentPrice && extraction.currentPrice > 0) {
        product.updatePrice(Price.create(extraction.currentPrice));
        await this.productRepo.save(product);
      }
    } else {
      const uniqueProductId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const extractedImages: string[] = extraction.image
        ? [extraction.image, ...(extraction.gallery || [])]
        : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'];
      const uniqueImages = Array.from(new Set(extractedImages.map((u) => u.trim()).filter(Boolean)));

      const mediaList: ProductMedia[] = uniqueImages.map((imgUrl, idx) => ({
        id: `med_img_${idx}_${Math.random().toString(36).slice(2, 7)}`,
        type: 'image' as const,
        url: imgUrl,
        order: idx,
        isPrimary: idx === 0,
      }));

      if ((extraction as any).videoUrl) {
        mediaList.push({
          id: `med_vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'video' as const,
          url: (extraction as any).videoUrl,
          order: mediaList.length,
          isPrimary: false,
          thumbnailUrl: (extraction as any).videoThumbnail,
        });
      }

      const productProps: ProductProps = {
        id: uniqueProductId,
        userId,
        title: extraction.title || 'Produto Sem Título',
        description: extraction.description || '',
        brand: extraction.brand || 'Geral',
        categoryId: extraction.category || 'Geral',
        marketplaceSlug: extraction.marketplace ? extraction.marketplace.toLowerCase() : 'shopee',
        originalUrl: rawUrl,
        affiliateUrl: AffiliateLink.create(extraction.affiliateUrl || rawUrl),
        currentPrice: Price.create(extraction.currentPrice || 0),
        previousPrice: extraction.originalPrice ? Price.create(extraction.originalPrice) : null,
        discountPercentage: DiscountPercentage.create(extraction.discountPercentage || 0),
        images: uniqueImages,
        media: mediaList,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      product = new Product(productProps);
      await this.productRepo.save(product);
    }

    // 2. Sempre criar uma NOVA oferta via CreateOfferUseCase (ID amigável OFF-YYYYMMDD-XXXX)
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

    console.log('[AUDIT EXECUTION] Product and Offer Saved (1:N):', {
      offerId: offer.id,
      productId: product.id,
      marketplace: product.marketplaceSlug,
      originalUrl: product.originalUrl,
      isNewProduct: !existingProduct,
    });

    return {
      product,
      offer,
      success: true,
    };
  }
}
