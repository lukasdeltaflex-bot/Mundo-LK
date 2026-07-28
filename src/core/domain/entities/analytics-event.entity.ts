export type AnalyticsEventType =
  | 'CLICK'
  | 'VIEW'
  | 'SHARE'
  | 'CONVERSION'
  | 'IMPRESSION';

export type AnalyticsEventSource =
  | 'shopee'
  | 'mercadolivre'
  | 'amazon'
  | 'instagram'
  | 'whatsapp'
  | 'telegram'
  | 'direct'
  | 'other';

export interface AnalyticsEventProps {
  id: string;
  userId: string;
  tenantId: string;
  event: AnalyticsEventType;
  source: AnalyticsEventSource;
  /** Opcional — evento pode existir sem campanha associada (fonte externa) */
  campaignId?: string;
  offerId?: string;
  productId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string; // ISO 8601
}

/**
 * AnalyticsEvent — Entidade da Coleção Universal de Eventos (Release 2.1.5)
 *
 * Diferente de campaign_events (domínio interno de Campaign),
 * analytics_events aceita eventos de qualquer fonte externa
 * (Instagram, WhatsApp, Shopee, etc.) com campaignId OPCIONAL.
 *
 * Imutável após gravação.
 */
export class AnalyticsEvent {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly event: AnalyticsEventType;
  public readonly source: AnalyticsEventSource;
  public readonly campaignId?: string;
  public readonly offerId?: string;
  public readonly productId?: string;
  public readonly metadata: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(props: AnalyticsEventProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.event = props.event;
    this.source = props.source;
    this.campaignId = props.campaignId;
    this.offerId = props.offerId;
    this.productId = props.productId;
    this.metadata = props.metadata || {};
    this.timestamp = props.timestamp || new Date().toISOString();
  }
}
