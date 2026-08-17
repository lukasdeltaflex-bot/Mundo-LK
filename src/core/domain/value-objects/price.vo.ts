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
    return Price.formatBRL(this.amount, this.currency);
  }

  public static formatBRL(amount: number | null | undefined, currency: string = 'BRL'): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  public static parseBRL(input: string | number | null | undefined): number {
    if (input === null || input === undefined || input === '') {
      return 0;
    }
    if (typeof input === 'number') {
      return isNaN(input) || input < 0 ? 0 : Number(input.toFixed(2));
    }
    
    let clean = String(input)
      .replace(/R\$\s?/gi, '')
      .replace(/\s/g, '')
      .trim();

    if (!clean) return 0;

    // Se contem virgula (padrão brasileiro R$ 1.234,56 ou 1234,56)
    if (clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    }

    const val = parseFloat(clean);
    return isNaN(val) || val < 0 ? 0 : Number(val.toFixed(2));
  }
}
