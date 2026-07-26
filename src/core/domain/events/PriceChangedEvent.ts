import { IDomainEvent } from './IDomainEvent';
import { Product } from '../entities/product.entity';
import { Price } from '../value-objects/price.vo';

export interface PriceChangedPayload {
  product: Product;
  previousPrice?: Price | null;
  newPrice: Price;
}

export class PriceChangedEvent implements IDomainEvent<PriceChangedPayload> {
  public readonly eventName: string = 'PriceChangedEvent';
  public readonly occurredOn: Date;
  public readonly payload: PriceChangedPayload;

  constructor(product: Product, previousPrice: Price | null | undefined, newPrice: Price) {
    this.occurredOn = new Date();
    this.payload = { product, previousPrice, newPrice };
  }
}
