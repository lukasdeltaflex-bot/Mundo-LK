import { MarketplaceConnectionSlug } from './marketplace-connection.entity';

export type HealthStatus = 'ONLINE' | 'WARNING' | 'ERROR' | 'OFFLINE';

export interface MarketplaceHealthProps {
  id: string;
  userId: string;
  tenantId: string;
  marketplaceSlug: MarketplaceConnectionSlug;
  status: HealthStatus;
  healthScore: number; // 0-100
  latencyMs: number;
  apiStatus: string;
  tokenStatus: string;
  lastCheckedAt?: string;
  lastError?: string | null;
}

/**
 * MarketplaceHealth — Entidade Estrita de Saúde de Conexão (Release 2.2.8)
 *
 * Responsável EXCLUSIVAMENTE por monitorar disponibilidade da API, latência em ms,
 * status do token e erros de conexão.
 * Separada de MarketplaceStatistics (estatísticas de anúncios) para manter o objeto leve.
 */
export class MarketplaceHealth {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly marketplaceSlug: MarketplaceConnectionSlug;
  public status: HealthStatus;
  public healthScore: number;
  public latencyMs: number;
  public apiStatus: string;
  public tokenStatus: string;
  public lastCheckedAt: string;
  public lastError?: string | null;

  constructor(props: MarketplaceHealthProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.marketplaceSlug = props.marketplaceSlug;
    this.status = props.status || 'OFFLINE';
    this.healthScore = props.healthScore ?? 100;
    this.latencyMs = props.latencyMs || 0;
    this.apiStatus = props.apiStatus || 'DESCONHECIDO';
    this.tokenStatus = props.tokenStatus || 'DESCONHECIDO';
    this.lastCheckedAt = props.lastCheckedAt || new Date().toISOString();
    this.lastError = props.lastError || null;
  }
}
