export interface CampaignProps {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  productIds: string[];
}

export class Campaign {
  public readonly id: string;
  public name: string;
  public startDate: Date;
  public endDate: Date;
  public isActive: boolean;
  public productIds: string[];

  constructor(props: CampaignProps) {
    this.id = props.id;
    this.name = props.name;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.isActive = props.isActive;
    this.productIds = props.productIds;
  }
}
