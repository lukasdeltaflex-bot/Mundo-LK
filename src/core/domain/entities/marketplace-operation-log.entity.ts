import { MarketplaceConnectionSlug } from './marketplace-connection.entity';

export type OperationType =
  | 'SYNC_STOCK'
  | 'SYNC_PRICE'
  | 'CHECK_HEALTH'
  | 'RETRY_LISTING'
  | 'REFRESH_TOKEN'
  | 'BATCH_SYNC';

export interface MarketplaceOperationLogProps {
  id: string;
  userId: string;
  tenantId: string;
  type: OperationType;
  marketplaceSlug: MarketplaceConnectionSlug;
  status: 'SUCCESS' | 'FAILED';
  durationMs: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

/**
 * MarketplaceOperationLog — Entidade Imutável de Logs Operacionais (Release 2.2.8)
 *
 * Registra o histórico completo de execuções operacionais para auditoria e rastreio de variação de estado.
 */
export class MarketplaceOperationLog {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly type: OperationType;
  public readonly marketplaceSlug: MarketplaceConnectionSlug;
  public readonly status: 'SUCCESS' | 'FAILED';
  public readonly durationMs: number;
  public readonly metadata: Record<string, unknown>;
  public readonly createdAt: string;

  constructor(props: MarketplaceOperationLogProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.type = props.type;
    this.marketplaceSlug = props.marketplaceSlug;
    this.status = props.status;
    this.durationMs = props.durationMs || 0;
    this.metadata = props.metadata || {};
    this.createdAt = props.createdAt || new Date().toISOString();
  }
}
