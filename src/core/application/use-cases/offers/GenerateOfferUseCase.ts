import { IOfferRepository } from '../../../domain/ports/repositories/IOfferRepository';
import { IAIProviderAdapter } from '../../../domain/ports/ai/IAIProviderAdapter';
import { IDomainEventBus } from '../../../domain/events/IDomainEventBus';
import { Product } from '../../../domain/entities/product.entity';
import { Offer } from '../../../domain/entities/offer.entity';
import { OfferCreatedEvent } from '../../../domain/events/OfferCreatedEvent';

export class GenerateOfferUseCase {
  constructor(
    private readonly offerRepository: IOfferRepository,
    private readonly aiProvider: IAIProviderAdapter,
    private readonly eventBus: IDomainEventBus
  ) {}

  public async execute(product: Product): Promise<Offer> {
    const aiResult = await this.aiProvider.generateOfferContent(product);

    const offer = new Offer({
      id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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

    await this.offerRepository.save(offer);
    await this.eventBus.publish(new OfferCreatedEvent(offer, product));

    return offer;
  }
}
