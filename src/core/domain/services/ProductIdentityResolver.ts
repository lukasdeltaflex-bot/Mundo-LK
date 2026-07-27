import { MarketplaceRegistry } from '../../../infrastructure/marketplaces/registry/MarketplaceRegistry';

export class ProductIdentityResolver {
  private registry: MarketplaceRegistry;

  constructor(registry?: MarketplaceRegistry) {
    this.registry = registry || new MarketplaceRegistry();
  }

  public resolveCanonicalKey(expandedUrl: string): { marketplaceSlug: string; productId: string; canonicalKey: string } {
    const plugin = this.registry.getPluginForUrl(expandedUrl);
    const productId = plugin.extractProductId(expandedUrl) || `${plugin.slug}_${Buffer.from(expandedUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-16)}`;
    const canonicalKey = `${plugin.slug}:${productId}`;

    return {
      marketplaceSlug: plugin.slug,
      productId,
      canonicalKey,
    };
  }
}
