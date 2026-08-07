import { Offer } from '../../entities/offer.entity';

export interface IOfferRepository {
  findById(id: string): Promise<Offer | null>;
  findByProductId(productId: string, userId?: string): Promise<Offer[]>;
  findByUserId(userId: string): Promise<Offer[]>;
  save(offer: Offer): Promise<void>;
  create(offer: Offer): Promise<void>;
  update(id: string, offer: Partial<Offer>): Promise<void>;
  delete(id: string): Promise<void>;
}
