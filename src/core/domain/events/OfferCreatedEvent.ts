import { Offer } from '../entities/offer.entity';
import { Product } from '../entities/product.entity';

export interface OfferCreatedPayload {
  offer: Offer;
  product: Product;
}

export class OfferCreatedEvent {
  public readonly eventName: string = 'OfferCreatedEvent';
  public readonly occurredOn: Date;
  public readonly timestamp: string;
  public readonly payload: OfferCreatedPayload;

  constructor(offer: Offer, product: Product) {
    this.occurredOn = new Date();
    this.timestamp = this.occurredOn.toISOString();
    this.payload = { offer, product };
  }
}
