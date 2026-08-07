import { IOfferRepository } from '../../../domain/ports/repositories/IOfferRepository';
import { IProductRepository } from '../../../domain/ports/repositories/IProductRepository';
import { IDomainEventBus } from '../../../domain/events/IDomainEventBus';
import { Offer, OfferProps } from '../../../domain/entities/offer.entity';
import { Product } from '../../../domain/entities/product.entity';
import { OfferCreatedEvent } from '../../../domain/events/OfferCreatedEvent';

export interface CreateOfferDTO {
  product: Product;
  userId: string;
  scoreValue?: number;
  scoreLabel?: any;
  scoreJustification?: string;
  copies: any;
  hashtags?: string[];
  emojis?: string[];
  cta?: string;
  aiProviderUsed?: string;
  marketplaceId?: string;
  marketplaceName?: string;
  marketplaceDetectedBy?: string;
}

export class CreateOfferUseCase {
  constructor(
    private readonly offerRepository: IOfferRepository,
    private readonly productRepository: IProductRepository,
    private readonly eventBus?: IDomainEventBus
  ) {}

  public async execute(dto: CreateOfferDTO): Promise<Offer> {
    const { product, userId } = dto;

    // 1. Garantir que o produto existe no repositório de catálogo
    let existingProduct = await this.productRepository.findById(product.id);
    if (!existingProduct) {
      await this.productRepository.save(product);
      existingProduct = product;
    }

    // 2. Gerar ID de negócio amigável para a oferta (OFF-YYYYMMDD-xxxx)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).slice(2, 7).toUpperCase();
    const offerId = `OFF-${dateStr}-${randStr}`;

    const offerProps: OfferProps = {
      id: offerId,
      productId: existingProduct.id,
      userId,
      scoreValue: dto.scoreValue ?? 90,
      scoreLabel: dto.scoreLabel ?? 'EXCELLENT',
      scoreJustification: dto.scoreJustification ?? 'Oferta criada via UseCase de Domínio',
      copies: dto.copies,
      hashtags: dto.hashtags ?? [],
      emojis: dto.emojis ?? ['🔥', '✨'],
      cta: dto.cta ?? 'Garanta o seu hoje!',
      aiProviderUsed: dto.aiProviderUsed ?? 'gemini-2.5-flash',
      createdAt: new Date(),
      marketplaceId: dto.marketplaceId,
      marketplaceName: dto.marketplaceName,
      marketplaceDetectedBy: dto.marketplaceDetectedBy as any,
    };

    const offer = new Offer(offerProps);

    // 3. Persistência estrita através do contrato create() do repositório (Sem upsert)
    await this.offerRepository.create(offer);

    // 4. Disparo de evento de domínio
    if (this.eventBus) {
      try {
        await this.eventBus.publish(new OfferCreatedEvent(offer, existingProduct));
      } catch (err) {
        console.warn('[CreateOfferUseCase] Event publish warning:', err);
      }
    }

    return offer;
  }
}
