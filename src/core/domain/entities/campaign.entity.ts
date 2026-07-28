import { CampaignMetrics, CampaignMetricsProps } from '../value-objects/CampaignMetrics';
import { CampaignFinancial, CampaignFinancialProps } from '../value-objects/CampaignFinancial';
import { CampaignROI } from '../value-objects/CampaignROI';

export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export interface CampaignProps {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  offerId: string;
  productId: string;
  marketplaceSlug: string;
  status: CampaignStatus;
  metrics: CampaignMetrics;
  financial: CampaignFinancial;
  createdAt: Date;
  updatedAt: Date;
}

export class Campaign {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public name: string;
  public readonly offerId: string;
  public readonly productId: string;
  public readonly marketplaceSlug: string;
  public status: CampaignStatus;
  public metrics: CampaignMetrics;
  public financial: CampaignFinancial;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: CampaignProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.name = props.name;
    this.offerId = props.offerId;
    this.productId = props.productId;
    this.marketplaceSlug = props.marketplaceSlug;
    this.status = props.status || 'ACTIVE';
    this.metrics = props.metrics;
    this.financial = props.financial;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  public get roi(): number {
    return CampaignROI.calculate(this.financial.revenue, this.financial.cost);
  }
}
