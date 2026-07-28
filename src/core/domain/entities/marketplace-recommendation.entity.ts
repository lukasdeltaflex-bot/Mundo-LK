import { MarketplaceSlug } from './marketplace-trend.entity';

export type RecommendationStatus = 'NEW' | 'ACCEPTED' | 'DISMISSED' | 'EXECUTED';

export interface MarketplaceRecommendationProps {
  id: string;
  userId: string;
  tenantId: string;
  productCategory: string;
  keyword: string;
  marketplaceSlug: MarketplaceSlug;
  opportunityScore: number; // 0-100
  reasons: string[];
  suggestedAction: string;
  status: RecommendationStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * MarketplaceRecommendation — Entidade de Recomendações Comerciais (Release 2.3.2)
 * Transforma dados de inteligência de mercado em cartões acionáveis na interface para o usuário.
 */
export class MarketplaceRecommendation {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly productCategory: string;
  public readonly keyword: string;
  public readonly marketplaceSlug: MarketplaceSlug;
  public readonly opportunityScore: number;
  public readonly reasons: string[];
  public readonly suggestedAction: string;
  public status: RecommendationStatus;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: MarketplaceRecommendationProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.productCategory = props.productCategory;
    this.keyword = props.keyword;
    this.marketplaceSlug = props.marketplaceSlug;
    this.opportunityScore = props.opportunityScore || 0;
    this.reasons = props.reasons || [];
    this.suggestedAction = props.suggestedAction;
    this.status = props.status || 'NEW';
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }
}
