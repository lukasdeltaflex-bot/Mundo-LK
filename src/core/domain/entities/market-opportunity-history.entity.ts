import { MarketplaceSlug } from './marketplace-trend.entity';

export interface MarketOpportunityHistoryProps {
  id: string;
  userId: string;
  tenantId: string;
  recommendationId: string;
  keyword: string;
  marketplaceSlug: MarketplaceSlug;
  score: number;
  collectedAt?: string;
}

/**
 * MarketOpportunityHistory — Histórico de Evolução de Score (Release 2.3.2)
 * Registra a variação temporal de pontuação de oportunidade para acompanhar se uma tendência
 * está em ascensão, estabilizada ou em declínio. Imutável.
 */
export class MarketOpportunityHistory {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly recommendationId: string;
  public readonly keyword: string;
  public readonly marketplaceSlug: MarketplaceSlug;
  public readonly score: number;
  public readonly collectedAt: string;

  constructor(props: MarketOpportunityHistoryProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.recommendationId = props.recommendationId;
    this.keyword = props.keyword;
    this.marketplaceSlug = props.marketplaceSlug;
    this.score = props.score;
    this.collectedAt = props.collectedAt || new Date().toISOString();
  }
}
