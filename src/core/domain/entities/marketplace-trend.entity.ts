export type MarketplaceSlug = 'shopee' | 'mercadolivre' | 'amazon';

export type CompetitionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MarketplaceTrendProps {
  id: string;
  marketplaceSlug: MarketplaceSlug;
  category: string;
  keyword: string;
  searchVolumeGrowthPct: number; // Ex: +140%
  avgPrice: number;
  competitionLevel: CompetitionLevel;
  collectedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * MarketplaceTrend — Entidade Interna de Tendência de Mercado (Release 2.3.1)
 * Armazena inteligência externa coletada de marketplaces oficiais.
 * Acesso restrito via TrendIntelligenceService.
 */
export class MarketplaceTrend {
  public readonly id: string;
  public readonly marketplaceSlug: MarketplaceSlug;
  public readonly category: string;
  public readonly keyword: string;
  public readonly searchVolumeGrowthPct: number;
  public readonly avgPrice: number;
  public readonly competitionLevel: CompetitionLevel;
  public readonly collectedAt: string;
  public readonly metadata: Record<string, unknown>;

  constructor(props: MarketplaceTrendProps) {
    this.id = props.id;
    this.marketplaceSlug = props.marketplaceSlug;
    this.category = props.category;
    this.keyword = props.keyword;
    this.searchVolumeGrowthPct = props.searchVolumeGrowthPct || 0;
    this.avgPrice = props.avgPrice || 0;
    this.competitionLevel = props.competitionLevel || 'MEDIUM';
    this.collectedAt = props.collectedAt || new Date().toISOString();
    this.metadata = props.metadata || {};
  }
}
