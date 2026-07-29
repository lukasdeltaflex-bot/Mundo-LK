import crypto from 'crypto';

export type SocialChannel = 'whatsapp' | 'telegram' | 'instagram' | 'tiktok' | 'pinterest';
export type CopyStyle = 'aggressive' | 'natural' | 'urgency' | 'seo';
export type ShareStatus = 'DRAFT' | 'COPIED' | 'SHARED' | 'FAILED';

export interface AffiliateContentHistoryProps {
  id?: string;
  offerId: string;
  channel: SocialChannel;
  style: CopyStyle;
  copyText: string;
  affiliateUrlSnapshot: string;
  priceSnapshot: number;
  marketplace: string;
  aiModel?: string;
  status?: ShareStatus;
  createdAt?: string;
}

/**
 * AffiliateContentHistory — Entidade de Histórico de Conteúdo com Snapshots (Release 2.3.0)
 *
 * Registra o snapshot exato da oferta (preço e link de afiliado) no momento da criação,
 * garantindo imutabilidade das variações criadas pela IA.
 */
export class AffiliateContentHistory {
  public readonly id: string;
  public readonly offerId: string;
  public readonly channel: SocialChannel;
  public readonly style: CopyStyle;
  public readonly copyText: string;
  public readonly affiliateUrlSnapshot: string;
  public readonly priceSnapshot: number;
  public readonly marketplace: string;
  public readonly aiModel: string;
  public status: ShareStatus;
  public readonly createdAt: string;

  constructor(props: AffiliateContentHistoryProps) {
    this.offerId = props.offerId;
    this.channel = props.channel;
    this.style = props.style;
    this.copyText = props.copyText;
    this.affiliateUrlSnapshot = props.affiliateUrlSnapshot;
    this.priceSnapshot = props.priceSnapshot;
    this.marketplace = props.marketplace;
    this.aiModel = props.aiModel || 'Gemini 2.5 Flash / GPT-4o';
    this.status = props.status || 'DRAFT';
    this.createdAt = props.createdAt || new Date().toISOString();

    const idSeed = `${this.offerId}_${this.channel}_${this.style}_${this.createdAt}`;
    this.id = props.id || `hist_${crypto.createHash('sha256').update(idSeed).digest('hex').substring(0, 16)}`;
  }

  public markAsCopied(): void {
    this.status = 'COPIED';
  }

  public markAsShared(): void {
    this.status = 'SHARED';
  }

  public markAsFailed(): void {
    this.status = 'FAILED';
  }
}
