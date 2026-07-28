import { IMarketplacePlugin } from '../../../core/domain/ports/marketplaces/IMarketplacePlugin';
import { ShopeePlugin } from '../plugins/ShopeePlugin';
import { MercadoLivrePlugin } from '../plugins/MercadoLivrePlugin';
import { AmazonPlugin } from '../plugins/AmazonPlugin';
import { MagaluPlugin } from '../plugins/MagaluPlugin';
import { GenericPlugin } from '../plugins/GenericPlugin';
import { SimpleMarketplacePlugin } from '../plugins/SimpleMarketplacePlugin';

export class MarketplaceRegistry {
  private plugins: IMarketplacePlugin[] = [];
  private genericPlugin: IMarketplacePlugin;

  constructor() {
    this.genericPlugin = new GenericPlugin();
    this.registerPlugin(new ShopeePlugin());
    this.registerPlugin(new MercadoLivrePlugin());
    this.registerPlugin(new AmazonPlugin());
    this.registerPlugin(new MagaluPlugin());
    
    // Novas plataformas integradas dinamicamente via Registry sem alterar o core
    this.registerPlugin(new SimpleMarketplacePlugin('aliexpress', 'AliExpress', /aliexpress\.com/i));
    this.registerPlugin(new SimpleMarketplacePlugin('shein', 'Shein', /shein\.com/i));
    this.registerPlugin(new SimpleMarketplacePlugin('temu', 'Temu', /temu\.com/i));
    this.registerPlugin(new SimpleMarketplacePlugin('americanas', 'Americanas', /americanas\.com/i));
    this.registerPlugin(new SimpleMarketplacePlugin('via', 'Casas Bahia', /casasbahia\.com|extra\.com|ponto\.com/i));
    this.registerPlugin(new SimpleMarketplacePlugin('madeiramadeira', 'MadeiraMadeira', /madeiramadeira\.com/i));
    this.registerPlugin(new SimpleMarketplacePlugin('kabum', 'KaBuM!', /kabum\.com/i));
    this.registerPlugin(new SimpleMarketplacePlugin('leroymerlin', 'Leroy Merlin', /leroymerlin\.com/i));
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

  public getAllPlugins(): IMarketplacePlugin[] {
    return [...this.plugins];
  }
}
