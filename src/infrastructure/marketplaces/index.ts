import { MarketplaceRegistry } from './registry/marketplace.registry';
import { ShopeeAdapter } from './adapters/shopee.adapter';
import { MercadoLivreAdapter } from './adapters/mercado-livre.adapter';
import { AmazonAdapter } from './adapters/amazon.adapter';
import { MagaluAdapter } from './adapters/magalu.adapter';
import { GenericMarketplaceAdapter } from './adapters/generic.adapter';

export * from './registry/marketplace.registry';
export * from './adapters/shopee.adapter';
export * from './adapters/mercado-livre.adapter';
export * from './adapters/amazon.adapter';
export * from './adapters/magalu.adapter';
export * from './adapters/generic.adapter';

/**
 * Auto-registers all built-in Marketplace Adapters into the Singleton Registry.
 */
export function initializeMarketplaceRegistry(): MarketplaceRegistry {
  const registry = MarketplaceRegistry.getInstance();
  registry.register(new ShopeeAdapter());
  registry.register(new MercadoLivreAdapter());
  registry.register(new AmazonAdapter());
  registry.register(new MagaluAdapter());
  registry.register(new GenericMarketplaceAdapter()); // Generic fallback for any HTTP/HTTPS URL
  return registry;
}
