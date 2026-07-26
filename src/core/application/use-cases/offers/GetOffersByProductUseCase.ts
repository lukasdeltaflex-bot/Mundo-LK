import { IOfferRepository } from '../../../domain/ports/repositories/IOfferRepository';
import { Offer } from '../../../domain/entities/offer.entity';

export class GetOffersByProductUseCase {
  constructor(private readonly offerRepository: IOfferRepository) {}

  public async execute(productId: string): Promise<Offer[]> {
    return this.offerRepository.findByProductId(productId);
  }
}
