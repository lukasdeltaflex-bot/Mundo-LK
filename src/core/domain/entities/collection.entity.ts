export interface CollectionProps {
  id: string;
  title: string;
  description?: string;
  productIds: string[];
  createdAt: Date;
}

export class Collection {
  public readonly id: string;
  public title: string;
  public description?: string;
  public productIds: string[];
  public readonly createdAt: Date;

  constructor(props: CollectionProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.productIds = props.productIds;
    this.createdAt = props.createdAt;
  }
}
