import crypto from 'crypto';
import { SourceStatus } from './affiliate-offer.entity';

export interface OfferPriceHistoryProps {
  id?: string;
  offerId: string;
  previousPrice: number;
  newPrice: number;
  discountPercentage?: number | null;
  sourceStatus?: SourceStatus;
  detectedAt?: string;
}

/**
 * OfferPriceHistory — Histórico Imutável de Alterações de Preço (Release 2.3.0)
 *
 * Registra cada variação de preço detectada no marketplace para permitir análises
 * de tendências, momentos de melhor conversão e emissão de alertas de oportunidade.
 */
export class OfferPriceHistory {
  public readonly id: string;
  public readonly offerId: string;
  public readonly previousPrice: number;
  public readonly newPrice: number;
  public readonly discountPercentage: number | null;
  public readonly sourceStatus: SourceStatus;
  public readonly detectedAt: string;

  constructor(props: OfferPriceHistoryProps) {
    this.offerId = props.offerId;
    this.previousPrice = props.previousPrice;
    this.newPrice = props.newPrice;
    this.sourceStatus = props.sourceStatus || 'CONFIRMED';
    this.detectedAt = props.detectedAt || new Date().toISOString();

    const priceDrop = this.previousPrice - this.newPrice;
    this.discountPercentage = props.discountPercentage !== undefined
      ? props.discountPercentage
      : (priceDrop > 0 && this.previousPrice > 0 ? Math.round((priceDrop / this.previousPrice) * 100) : null);

    const idSeed = `${this.offerId}_${this.previousPrice}_${this.newPrice}_${this.detectedAt}`;
    this.id = props.id || `prc_${crypto.createHash('sha256').update(idSeed).digest('hex').substring(0, 16)}`;
  }
}
