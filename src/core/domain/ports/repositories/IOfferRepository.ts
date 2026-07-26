import { Offer } from '../../entities/offer.entity';

export interface IOfferRepository {
  findById(id: string): Promise<Offer | null>;
  findByProductId(productId: string): Promise<Offer[]>;
  save(offer: Offer): Promise<void>;
  delete(id: string): Promise<void>;
}
