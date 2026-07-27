import { MarketplaceCapabilities } from './IMarketplacePlugin';

export interface ICapabilityEngine {
  getCapabilities(marketplaceSlug: string): MarketplaceCapabilities;
  hasCapability(marketplaceSlug: string, capability: keyof MarketplaceCapabilities): boolean;
}
