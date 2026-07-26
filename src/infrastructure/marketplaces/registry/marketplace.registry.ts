import { IMarketplaceAdapter } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { IMarketplaceRegistry } from '../../../core/domain/ports/marketplaces/IMarketplaceRegistry';
import { MarketplaceNotSupportedError } from '../../../core/domain/errors/domain.error';

/**
 * Concrete Marketplace Registry Implementation.
 * Singleton registry for resolving marketplace adapters dynamically.
 */
export class MarketplaceRegistry implements IMarketplaceRegistry {
  private static instance: MarketplaceRegistry;
  private adapters: Map<string, IMarketplaceAdapter> = new Map();

  constructor() {}

  public static getInstance(): MarketplaceRegistry {
    if (!MarketplaceRegistry.instance) {
      MarketplaceRegistry.instance = new MarketplaceRegistry();
    }
    return MarketplaceRegistry.instance;
  }

  public register(adapter: IMarketplaceAdapter): void {
    this.adapters.set(adapter.marketplaceSlug, adapter);
  }

  public getAdapterForUrl(url: string): IMarketplaceAdapter {
    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle(url)) {
        return adapter;
      }
    }
    throw new MarketplaceNotSupportedError(url);
  }

  public getAdapterBySlug(slug: string): IMarketplaceAdapter | null {
    return this.adapters.get(slug) || null;
  }

  public getAllAdapters(): IMarketplaceAdapter[] {
    return Array.from(this.adapters.values());
  }
}
