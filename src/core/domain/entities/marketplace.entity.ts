export interface MarketplaceProps {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
}

export class Marketplace {
  public readonly id: string;
  public readonly name: string;
  public readonly slug: string;
  public enabled: boolean;

  constructor(props: MarketplaceProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.enabled = props.enabled;
  }

  public toggleEnabled(): void {
    this.enabled = !this.enabled;
  }
}
