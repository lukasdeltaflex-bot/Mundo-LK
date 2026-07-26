import { InvalidDiscountError } from '../errors/domain.error';
import { Price } from './price.vo';

/**
 * Value Object representing a Discount Percentage.
 * Automatically computes percentage when given previous and current Price.
 */
export class DiscountPercentage {
  public readonly value: number;

  constructor(value: number) {
    if (typeof value !== 'number' || isNaN(value) || value < 0 || value > 100) {
      throw new InvalidDiscountError(`Discount percentage must be between 0 and 100. Received: ${value}`);
    }
    this.value = Math.round(value);
  }

  public static create(value: number): DiscountPercentage {
    return new DiscountPercentage(value);
  }

  public static calculate(currentPrice: Price, previousPrice?: Price | null): DiscountPercentage {
    if (!previousPrice || previousPrice.amount <= currentPrice.amount || previousPrice.isZero()) {
      return new DiscountPercentage(0);
    }
    const discount = ((previousPrice.amount - currentPrice.amount) / previousPrice.amount) * 100;
    return new DiscountPercentage(Math.min(100, Math.max(0, discount)));
  }

  public hasDiscount(): boolean {
    return this.value > 0;
  }

  public formatString(): string {
    return `${this.value}% OFF`;
  }
}
