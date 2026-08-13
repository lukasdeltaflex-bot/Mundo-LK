export interface DiscoveryResultProps {
  title: string;
  currentPrice: number;
  previousPrice?: number | null;
  image: string;
  originalUrl: string;
  marketplace: string;
  marketplaceProductId?: string | null;
  source: 'feed' | 'public_deals';
  isValid: boolean;
  validationError?: string | null;
}

export class DiscoveryResult {
  public readonly title: string;
  public readonly currentPrice: number;
  public readonly previousPrice?: number | null;
  public readonly image: string;
  public readonly originalUrl: string;
  public readonly marketplace: string;
  public readonly marketplaceProductId?: string | null;
  public readonly source: 'feed' | 'public_deals';
  public readonly isValid: boolean;
  public readonly validationError?: string | null;

  constructor(props: DiscoveryResultProps) {
    this.title = props.title;
    this.currentPrice = props.currentPrice;
    this.previousPrice = props.previousPrice ?? null;
    this.image = props.image;
    this.originalUrl = props.originalUrl;
    this.marketplace = props.marketplace;
    this.marketplaceProductId = props.marketplaceProductId ?? null;
    this.source = props.source;
    this.isValid = props.isValid;
    this.validationError = props.validationError ?? null;
  }
}
