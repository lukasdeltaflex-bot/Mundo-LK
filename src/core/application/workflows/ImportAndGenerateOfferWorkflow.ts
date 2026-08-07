import { ImportAndGenerateOfferInputDTO, ImportAndGenerateOfferOutputDTO } from '../dtos/import-offer.dto';
import { IMarketplaceRegistry } from '../../domain/ports/marketplaces/IMarketplaceRegistry';
import { IProductRepository } from '../../domain/ports/repositories/IProductRepository';
import { IOfferRepository } from '../../domain/ports/repositories/IOfferRepository';
import { IAIProviderAdapter } from '../../domain/ports/ai/IAIProviderAdapter';
import { IDomainEventBus } from '../../domain/events/IDomainEventBus';
import { Product } from '../../domain/entities/product.entity';
import { Offer } from '../../domain/entities/offer.entity';
import { Price, DiscountPercentage, AffiliateLink } from '../../domain/value-objects';
import { OfferCreatedEvent } from '../../domain/events/OfferCreatedEvent';

/**
 * Workflow Engine: ImportAndGenerateOfferWorkflow.
 * Pure Application Layer Orchestrator.
 * Orchestrates: Marketplace identification -> Data extraction -> Catalog Persistence -> AI Generation -> Score -> Event Dispatching.
 * Does NOT contain business rules or direct DB dependencies.
 */
export class ImportAndGenerateOfferWorkflow {
  constructor(
    private readonly marketplaceRegistry: IMarketplaceRegistry,
    private readonly productRepository: IProductRepository,
    private readonly offerRepository: IOfferRepository,
    private readonly aiProvider: IAIProviderAdapter,
    private readonly eventBus: IDomainEventBus
  ) {}

  public async execute(input: ImportAndGenerateOfferInputDTO): Promise<ImportAndGenerateOfferOutputDTO> {
    // 1. Resolve Marketplace Adapter
    const adapter = this.marketplaceRegistry.getAdapterForUrl(input.url);

    // 2. Extract Data from Marketplace
    const extractedData = await adapter.extractProductData(input.url);

    // 3. Build Affiliate Link
    const affiliateUrlString = await adapter.buildAffiliateLink(input.url, input.affiliateTag || 'default');
    const affiliateLink = AffiliateLink.create(affiliateUrlString);

    // 4. Construct Product Entity
    const currentPrice = Price.create(extractedData.currentPrice);
    const previousPrice = extractedData.previousPrice ? Price.create(extractedData.previousPrice) : null;
    const discountPercentage = DiscountPercentage.calculate(currentPrice, previousPrice);

    const product = new Product({
      id: `prod_${Date.now()}_${Math.floor(performance.now() * 1000)}`,
      userId: input.userId,
      title: extractedData.title,
      description: extractedData.description,
      brand: extractedData.brand || 'Desconhecida',
      categoryId: 'general',
      marketplaceSlug: adapter.marketplaceSlug,
      originalUrl: extractedData.originalUrl,
      affiliateUrl: affiliateLink,
      currentPrice,
      previousPrice,
      discountPercentage,
      images: [extractedData.mainImage, ...(extractedData.gallery || [])],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.productRepository.save(product);

    // 5. Generate AI Offer Content & Score
    const aiResult = await this.aiProvider.generateOfferContent(product);

    const offer = new Offer({
      id: `OFF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      productId: product.id,
      userId: product.userId,
      scoreValue: aiResult.score.value,
      scoreLabel: aiResult.score.level.level,
      scoreJustification: aiResult.score.justification,
      copies: aiResult.copies,
      hashtags: aiResult.hashtags,
      emojis: aiResult.emojis,
      cta: aiResult.cta,
      aiProviderUsed: this.aiProvider.providerName,
      createdAt: new Date(),
    });

    await this.offerRepository.create(offer);

    // 6. Dispatch Domain Event
    await this.eventBus.publish(new OfferCreatedEvent(offer, product));

    return { product, offer };
  }
}
