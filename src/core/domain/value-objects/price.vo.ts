import { InvalidPriceError } from '../errors/domain.error';

/**
 * Value Object representing a Monetary Price.
 * Immutable and self-validating.
 */
export class Price {
  public readonly amount: number;
  public readonly currency: string;

  constructor(amount: number, currency: string = 'BRL') {
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
      throw new InvalidPriceError(`Invalid price amount: ${amount}`);
    }
    this.amount = Number(amount.toFixed(2));
    this.currency = currency.toUpperCase();
  }

  public static create(amount: number, currency: string = 'BRL'): Price {
    return new Price(amount, currency);
  }

  public isZero(): boolean {
    return this.amount === 0;
  }

  public isGreaterThan(other: Price): boolean {
    return this.amount > other.amount;
  }

  public isLessThan(other: Price): boolean {
    return this.amount < other.amount;
  }

  public equals(other: Price): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  public formatBRL(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }
}
