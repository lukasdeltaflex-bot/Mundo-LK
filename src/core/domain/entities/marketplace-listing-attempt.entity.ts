import { MarketplaceConnectionSlug } from './marketplace-connection.entity';

export interface MarketplaceListingAttemptProps {
  id: string;
  listingId: string;
  userId: string;
  tenantId: string;
  marketplaceSlug: MarketplaceConnectionSlug;
  status: 'SUCCESS' | 'FAILED';
  requestPayload: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  error?: string | null;
  createdAt?: string;
}

/**
 * MarketplaceListingAttempt — Entidade de Histórico de Tentativas (Release 2.2.7)
 * Grava cada disparo feito contra APIs externas para auditoria, resiliência e diagnóstico técnico.
 */
export class MarketplaceListingAttempt {
  public readonly id: string;
  public readonly listingId: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly marketplaceSlug: MarketplaceConnectionSlug;
  public readonly status: 'SUCCESS' | 'FAILED';
  public readonly requestPayload: Record<string, unknown>;
  public readonly responsePayload?: Record<string, unknown>;
  public readonly error?: string | null;
  public readonly createdAt: string;

  constructor(props: MarketplaceListingAttemptProps) {
    this.id = props.id;
    this.listingId = props.listingId;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.marketplaceSlug = props.marketplaceSlug;
    this.status = props.status;
    this.requestPayload = props.requestPayload || {};
    this.responsePayload = props.responsePayload || {};
    this.error = props.error || null;
    this.createdAt = props.createdAt || new Date().toISOString();
  }
}
