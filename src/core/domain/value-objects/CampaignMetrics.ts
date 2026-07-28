export interface CampaignMetricsProps {
  views: number;
  clicks: number;
  shares: number;
  conversions: number;
}

export class CampaignMetrics {
  public readonly views: number;
  public readonly clicks: number;
  public readonly shares: number;
  public readonly conversions: number;
  public readonly ctr: number;
  public readonly conversionRate: number;

  constructor(props: CampaignMetricsProps) {
    this.views = props.views || 0;
    this.clicks = props.clicks || 0;
    this.shares = props.shares || 0;
    this.conversions = props.conversions || 0;
    this.ctr = this.views > 0 ? Number(((this.clicks / this.views) * 100).toFixed(2)) : 0;
    this.conversionRate = this.clicks > 0 ? Number(((this.conversions / this.clicks) * 100).toFixed(2)) : 0;
  }

  public static create(props: Partial<CampaignMetricsProps> = {}): CampaignMetrics {
    return new CampaignMetrics({
      views: props.views || 0,
      clicks: props.clicks || 0,
      shares: props.shares || 0,
      conversions: props.conversions || 0,
    });
  }
}
