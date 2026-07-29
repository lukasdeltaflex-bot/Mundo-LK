import crypto from 'crypto';

export interface TrackingParameters {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  subId?: string;
  affiliateId?: string;
  tag?: string;
  campaignId?: string;
  [key: string]: string | undefined;
}

export interface AffiliateLinkProps {
  id?: string;
  originalMarketplaceUrl: string;
  affiliateUrl: string;
  trackingParameters?: TrackingParameters;
  hashIntegrity?: string;
  createdAt?: string;
}

/**
 * AffiliateLink — Entidade Imutável de Link de Afiliado (Release 2.3.0)
 *
 * Trava de Segurança: A IA tem permissão de APENAS LEITURA sobre a affiliateUrl
 * e nunca pode modificar os parâmetros de rastreamento do usuário.
 */
export class AffiliateLink {
  public readonly id: string;
  public readonly originalMarketplaceUrl: string;
  public readonly affiliateUrl: string;
  public readonly trackingParameters: TrackingParameters;
  public readonly hashIntegrity: string;
  public readonly createdAt: string;

  constructor(props: AffiliateLinkProps) {
    this.originalMarketplaceUrl = props.originalMarketplaceUrl.trim();
    this.affiliateUrl = props.affiliateUrl.trim();
    this.trackingParameters = props.trackingParameters || {};
    this.createdAt = props.createdAt || new Date().toISOString();

    const idSeed = `${this.originalMarketplaceUrl}_${this.affiliateUrl}_${this.createdAt}`;
    this.id = props.id || `lnk_${crypto.createHash('sha256').update(idSeed).digest('hex').substring(0, 16)}`;

    // Computa a hash de integridade para impedir adulteração de parâmetros
    const integritySeed = `${this.id}:${this.affiliateUrl}:${JSON.stringify(this.trackingParameters)}`;
    this.hashIntegrity = props.hashIntegrity || crypto.createHash('sha256').update(integritySeed).digest('hex');
  }

  /**
   * Valida a integridade do link em tempo de execução
   */
  public verifyIntegrity(): boolean {
    const integritySeed = `${this.id}:${this.affiliateUrl}:${JSON.stringify(this.trackingParameters)}`;
    const computedHash = crypto.createHash('sha256').update(integritySeed).digest('hex');
    return computedHash === this.hashIntegrity;
  }
}
