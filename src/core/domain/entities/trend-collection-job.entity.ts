import { MarketplaceSlug } from './marketplace-trend.entity';

export type TrendJobStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface TrendCollectionJobProps {
  id: string;
  marketplaceSlug: MarketplaceSlug;
  status: TrendJobStatus;
  trendsCollected: number;
  errorsCount: number;
  errorMessage?: string | null;
  startedAt: string;
  finishedAt?: string | null;
}

/**
 * TrendCollectionJob — Entidade de Auditoria de Coleta de Tendências (Release 2.3.1)
 * Monitora ciclos de execução de inteligência por marketplace para diagnóstico e resiliência.
 */
export class TrendCollectionJob {
  public readonly id: string;
  public readonly marketplaceSlug: MarketplaceSlug;
  public status: TrendJobStatus;
  public trendsCollected: number;
  public errorsCount: number;
  public errorMessage?: string | null;
  public readonly startedAt: string;
  public finishedAt?: string | null;

  constructor(props: TrendCollectionJobProps) {
    this.id = props.id;
    this.marketplaceSlug = props.marketplaceSlug;
    this.status = props.status || 'RUNNING';
    this.trendsCollected = props.trendsCollected || 0;
    this.errorsCount = props.errorsCount || 0;
    this.errorMessage = props.errorMessage || null;
    this.startedAt = props.startedAt || new Date().toISOString();
    this.finishedAt = props.finishedAt || null;
  }
}
