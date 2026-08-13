import { DiscoveryResult } from '../../entities/DiscoveryResult';

export interface DiscoveryOptions {
  limit?: number;
  feedUrl?: string;
  category?: string;
}

export interface IAffiliateDiscoveryProvider {
  readonly marketplaceSlug: string;
  readonly marketplaceName: string;

  discover(options?: DiscoveryOptions): Promise<DiscoveryResult[]>;
}
