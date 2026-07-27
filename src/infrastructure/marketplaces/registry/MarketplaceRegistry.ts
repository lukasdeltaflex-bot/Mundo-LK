import { IMarketplacePlugin } from '../../../core/domain/ports/marketplaces/IMarketplacePlugin';
import { ShopeePlugin } from '../plugins/ShopeePlugin';
import { MercadoLivrePlugin } from '../plugins/MercadoLivrePlugin';
import { AmazonPlugin } from '../plugins/AmazonPlugin';
import { MagaluPlugin } from '../plugins/MagaluPlugin';
import { GenericPlugin } from '../plugins/GenericPlugin';

export class MarketplaceRegistry {
  private plugins: IMarketplacePlugin[] = [];
  private genericPlugin: IMarketplacePlugin;

  constructor() {
    this.genericPlugin = new GenericPlugin();
    this.registerPlugin(new ShopeePlugin());
    this.registerPlugin(new MercadoLivrePlugin());
    this.registerPlugin(new AmazonPlugin());
    this.registerPlugin(new MagaluPlugin());
  }

  public registerPlugin(plugin: IMarketplacePlugin): void {
    this.plugins.push(plugin);
  }

  public getPluginForUrl(url: string): IMarketplacePlugin {
    for (const plugin of this.plugins) {
      if (plugin.canHandle(url)) {
        return plugin;
      }
    }
    return this.genericPlugin;
  }

  public getPluginBySlug(slug: string): IMarketplacePlugin {
    const p = this.plugins.find(plugin => plugin.slug === slug);
    return p || this.genericPlugin;
  }
}
