import { IOfferRepository } from '../../../domain/ports/repositories/IOfferRepository';
import { Offer } from '../../../domain/entities/offer.entity';

export interface UpdateOfferDTO {
  offerId: string;
  userId: string;
  changes: Partial<Offer>;
}

export class UpdateOfferUseCase {
  constructor(private readonly offerRepository: IOfferRepository) {}

  public async execute(dto: UpdateOfferDTO): Promise<Offer> {
    const { offerId, userId, changes } = dto;

    if (!offerId) {
      throw new Error('[UpdateOfferUseCase] ID da oferta é obrigatório para atualização.');
    }

    const existingOffer = await this.offerRepository.findById(offerId);
    if (!existingOffer) {
      throw new Error(`[UpdateOfferUseCase] Oferta ${offerId} não encontrada para atualização.`);
    }

    if (existingOffer.userId !== userId) {
      throw new Error('[UpdateOfferUseCase] Operação não permitida: A oferta pertence a outro usuário.');
    }

    // Executa a atualização sem jamais criar novos documentos ou IDs
    await this.offerRepository.update(offerId, changes);

    return new Offer({
      ...existingOffer,
      ...changes,
      updatedAt: new Date(),
    } as any);
  }
}
