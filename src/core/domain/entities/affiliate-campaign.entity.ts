import crypto from 'crypto';
import { SocialChannel } from './affiliate-content-history.entity';

export type CampaignType = 'FLASH_OFFER' | 'PRICE_DROP' | 'NEW_PRODUCT' | 'COUPON' | 'MANUAL';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'EXECUTED' | 'CANCELLED';

export interface CampaignCopies {
  whatsapp?: string;
  telegram?: string;
  instagram?: string;
  tiktok?: string;
  pinterest?: string;
}

export interface AffiliateCampaignProps {
  id?: string;
  userId: string;
  tenantId?: string;
  offerId: string;
  name: string;
  campaignType: CampaignType;
  channels: SocialChannel[];
  copies: CampaignCopies;
  scheduledAt?: string | null;
  status?: CampaignStatus;
  createdAt?: string;
}

/**
 * AffiliateCampaign — Entidade de Campanha de Divulgação do Afiliado (Release 2.3.0)
 *
 * Agrupa uma oferta de afiliado com os canais selecionados, variações de copy
 * por canal e timestamp de agendamento.
 */
export class AffiliateCampaign {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly offerId: string;
  public readonly name: string;
  public readonly campaignType: CampaignType;
  public readonly channels: SocialChannel[];
  public readonly copies: CampaignCopies;
  public scheduledAt: string | null;
  public status: CampaignStatus;
  public readonly createdAt: string;

  constructor(props: AffiliateCampaignProps) {
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.offerId = props.offerId;
    this.name = props.name;
    this.campaignType = props.campaignType;
    this.channels = props.channels;
    this.copies = props.copies;
    this.scheduledAt = props.scheduledAt || null;
    this.status = props.status || 'DRAFT';
    this.createdAt = props.createdAt || new Date().toISOString();

    const idSeed = `${this.userId}_${this.offerId}_${this.name}_${this.createdAt}`;
    this.id = props.id || `cmp_${crypto.createHash('sha256').update(idSeed).digest('hex').substring(0, 16)}`;
  }

  public schedule(scheduledAt: string): void {
    this.scheduledAt = scheduledAt;
    this.status = 'SCHEDULED';
  }

  public markAsExecuted(): void {
    this.status = 'EXECUTED';
  }

  public cancel(): void {
    this.status = 'CANCELLED';
  }
}
