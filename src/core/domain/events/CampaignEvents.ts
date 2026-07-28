// ── Evento: Campanha Criada ───────────────────────────────────────────────────
export interface CampaignCreatedPayload {
  campaignId: string;
  userId: string;
  offerId: string;
  productId: string;
  marketplaceSlug: string;
  name: string;
}

export class CampaignCreatedEvent {
  public readonly eventName = 'CampaignCreatedEvent';
  public readonly occurredOn: Date;
  public readonly timestamp: string;
  public readonly payload: CampaignCreatedPayload;

  constructor(payload: CampaignCreatedPayload) {
    this.occurredOn = new Date();
    this.timestamp = this.occurredOn.toISOString();
    this.payload = payload;
  }
}

// ── Evento: Oferta Clicada ────────────────────────────────────────────────────
export interface OfferClickedPayload {
  campaignId: string;
  userId: string;
  offerId: string;
  source: string; // ex: 'whatsapp', 'telegram', 'direct'
  marketplaceSlug: string;
}

export class OfferClickedEvent {
  public readonly eventName = 'OfferClickedEvent';
  public readonly occurredOn: Date;
  public readonly timestamp: string;
  public readonly payload: OfferClickedPayload;

  constructor(payload: OfferClickedPayload) {
    this.occurredOn = new Date();
    this.timestamp = this.occurredOn.toISOString();
    this.payload = payload;
  }
}

// ── Evento: Oferta Compartilhada ──────────────────────────────────────────────
export interface OfferSharedPayload {
  campaignId: string;
  userId: string;
  offerId: string;
  channel: string; // ex: 'whatsapp', 'telegram', 'instagram'
}

export class OfferSharedEvent {
  public readonly eventName = 'OfferSharedEvent';
  public readonly occurredOn: Date;
  public readonly timestamp: string;
  public readonly payload: OfferSharedPayload;

  constructor(payload: OfferSharedPayload) {
    this.occurredOn = new Date();
    this.timestamp = this.occurredOn.toISOString();
    this.payload = payload;
  }
}

// ── Evento: Conversão Registrada ──────────────────────────────────────────────
export interface ConversionRegisteredPayload {
  campaignId: string;
  userId: string;
  offerId: string;
  revenue: number;
  commission: number;
  marketplaceSlug: string;
}

export class ConversionRegisteredEvent {
  public readonly eventName = 'ConversionRegisteredEvent';
  public readonly occurredOn: Date;
  public readonly timestamp: string;
  public readonly payload: ConversionRegisteredPayload;

  constructor(payload: ConversionRegisteredPayload) {
    this.occurredOn = new Date();
    this.timestamp = this.occurredOn.toISOString();
    this.payload = payload;
  }
}
