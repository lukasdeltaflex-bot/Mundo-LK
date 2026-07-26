import { IDomainEvent } from './IDomainEvent';
import { Offer } from '../entities/offer.entity';
import { Product } from '../entities/product.entity';

export interface OfferCreatedPayload {
  offer: Offer;
  product: Product;
}

export class OfferCreatedEvent implements IDomainEvent<OfferCreatedPayload> {
  public readonly eventName: string = 'OfferCreatedEvent';
  public readonly occurredOn: Date;
  public readonly payload: OfferCreatedPayload;

  constructor(offer: Offer, product: Product) {
    this.occurredOn = new Date();
    this.payload = { offer, product };
  }
}
