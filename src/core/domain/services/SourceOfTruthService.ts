import { OfferPricing, OfferCommission, SourceStatus } from '../entities/affiliate-offer.entity';

export interface RawPricingInput {
  currentPrice?: number | null;
  originalPrice?: number | null;
}

export interface RawCommissionInput {
  value?: number | null;
  percentage?: number | null;
}

/**
 * SourceOfTruthService — Serviço de Garantia da Fonte da Verdade (Release 2.3.0)
 *
 * Princípio Fundamental:
 * Toda informação deve ser proveniente de uma fonte real confirmada ou rotulada como NOT_AVAILABLE.
 * Proibida a estimativa ou geração de valores numéricos arbitrários.
 */
export class SourceOfTruthService {
  private static instance: SourceOfTruthService;

  private constructor() {}

  public static getInstance(): SourceOfTruthService {
    if (!SourceOfTruthService.instance) {
      SourceOfTruthService.instance = new SourceOfTruthService();
    }
    return SourceOfTruthService.instance;
  }

  public validatePricing(input: RawPricingInput): OfferPricing {
    if (typeof input.currentPrice === 'number' && !isNaN(input.currentPrice) && input.currentPrice > 0) {
      const currentPrice = input.currentPrice;
      const originalPrice =
        typeof input.originalPrice === 'number' && !isNaN(input.originalPrice) && input.originalPrice > currentPrice
          ? input.originalPrice
          : null;

      const discountPercentage = originalPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : null;

      return {
        currentPrice,
        originalPrice,
        discountPercentage,
        sourceStatus: 'CONFIRMED',
      };
    }

    return {
      currentPrice: 0,
      originalPrice: null,
      discountPercentage: null,
      sourceStatus: 'NOT_AVAILABLE',
    };
  }

  public validateCommission(input: RawCommissionInput): OfferCommission {
    const hasValue = typeof input.value === 'number' && !isNaN(input.value) && input.value > 0;
    const hasPercentage = typeof input.percentage === 'number' && !isNaN(input.percentage) && input.percentage > 0;

    if (hasValue || hasPercentage) {
      return {
        value: hasValue ? (input.value as number) : null,
        percentage: hasPercentage ? (input.percentage as number) : null,
        sourceStatus: 'CONFIRMED',
      };
    }

    return {
      value: null,
      percentage: null,
      sourceStatus: 'NOT_AVAILABLE',
    };
  }
}
