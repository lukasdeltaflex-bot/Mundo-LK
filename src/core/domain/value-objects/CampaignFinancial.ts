export interface CampaignFinancialProps {
  revenue: number;
  commission: number;
  cost?: number;
}

export class CampaignFinancial {
  public readonly revenue: number;
  public readonly commission: number;
  public readonly cost: number;
  public readonly profit: number;

  constructor(props: CampaignFinancialProps) {
    this.revenue = props.revenue || 0;
    this.commission = props.commission || 0;
    this.cost = props.cost || 0;
    this.profit = Number((this.commission - this.cost).toFixed(2));
  }

  public static create(props: Partial<CampaignFinancialProps> = {}): CampaignFinancial {
    return new CampaignFinancial({
      revenue: props.revenue || 0,
      commission: props.commission || 0,
      cost: props.cost || 0,
    });
  }
}
