import { ICapabilityEngine } from '../../../core/domain/ports/marketplaces/ICapabilityEngine';
import { MarketplaceCapabilities } from '../../../core/domain/ports/marketplaces/IMarketplacePlugin';

export const MARKETPLACE_CONFIG: Record<string, MarketplaceCapabilities> = {
  shopee: {
    hasPrime: false,
    hasFull: false,
    hasMall: true,
    hasCoins: true,
    hasStorePickup: false,
    hasCoupons: true,
    hasInstallments: true,
  },
  'mercado-livre': {
    hasPrime: false,
    hasFull: true,
    hasMall: false,
    hasCoins: false,
    hasStorePickup: true,
    hasCoupons: true,
    hasInstallments: true,
  },
  amazon: {
    hasPrime: true,
    hasFull: false,
    hasMall: false,
    hasCoins: false,
    hasStorePickup: false,
    hasCoupons: true,
    hasInstallments: true,
  },
  magalu: {
    hasPrime: false,
    hasFull: false,
    hasMall: false,
    hasCoins: false,
    hasStorePickup: true,
    hasCoupons: true,
    hasInstallments: true,
  },
  generic: {
    hasPrime: false,
    hasFull: false,
    hasMall: false,
    hasCoins: false,
    hasStorePickup: false,
    hasCoupons: false,
    hasInstallments: false,
  },
};

export class CapabilityEngine implements ICapabilityEngine {
  public getCapabilities(marketplaceSlug: string): MarketplaceCapabilities {
    return MARKETPLACE_CONFIG[marketplaceSlug] || MARKETPLACE_CONFIG.generic;
  }

  public hasCapability(marketplaceSlug: string, capability: keyof MarketplaceCapabilities): boolean {
    const caps = this.getCapabilities(marketplaceSlug);
    return !!caps[capability];
  }
}
