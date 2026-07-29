export interface MarketplaceStatisticsProps {
  totalListings: number;
  publishedListings: number;
  failedListings: number;
  pausedListings: number;
  draftListings: number;
  expiredTokens: number;
}

/**
 * MarketplaceStatistics — Value Object Imutável de Estatísticas Operacionais (Release 2.2.8)
 *
 * Agrega contadores de anúncios por status sem poluir a entidade MarketplaceHealth.
 */
export class MarketplaceStatistics {
  public readonly totalListings: number;
  public readonly publishedListings: number;
  public readonly failedListings: number;
  public readonly pausedListings: number;
  public readonly draftListings: number;
  public readonly expiredTokens: number;

  constructor(props: MarketplaceStatisticsProps) {
    this.totalListings = props.totalListings || 0;
    this.publishedListings = props.publishedListings || 0;
    this.failedListings = props.failedListings || 0;
    this.pausedListings = props.pausedListings || 0;
    this.draftListings = props.draftListings || 0;
    this.expiredTokens = props.expiredTokens || 0;
  }
}
