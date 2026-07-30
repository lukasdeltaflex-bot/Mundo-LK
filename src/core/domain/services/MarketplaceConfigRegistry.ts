import { MarketplaceContext } from '../entities/UniversalMarketplaceContext';

export interface MarketplaceConfigDoc {
  id: string;
  nome: string;
  logo: string;
  cor: string;
  icone: string;
  categoria?: string;
  tipo?: string;
  strategy: {
    trustLevel: 'popular' | 'intermediario' | 'premium' | 'internacional';
    audienceProfile: 'preco_competitivo' | 'conveniencia' | 'qualidade_premium' | 'achados';
    buyingBehavior: 'impulso' | 'pesquisa' | 'fidelidade';
    conversionTriggers: string[];
    recommendedStyle: string;
  };
}

export class MarketplaceConfigRegistry {
  private static instance: MarketplaceConfigRegistry;
  private customConfigs: Map<string, MarketplaceConfigDoc> = new Map();

  private defaultConfigs: Record<string, MarketplaceConfigDoc> = {
    shopee: {
      id: 'shopee',
      nome: 'Shopee',
      logo: 'https://cdn.worldvectorlogo.com/logos/shopee-1.svg',
      cor: '#EE4D2D',
      icone: 'ShoppingBag',
      categoria: 'General Marketplace',
      tipo: 'social-commerce',
      strategy: {
        trustLevel: 'popular',
        audienceProfile: 'preco_competitivo',
        buyingBehavior: 'impulso',
        conversionTriggers: ['cupom', 'frete_gratis', 'desconto', 'achados'],
        recommendedStyle: 'promocao',
      },
    },
    mercadolivre: {
      id: 'mercadolivre',
      nome: 'Mercado Livre',
      logo: 'https://cdn.worldvectorlogo.com/logos/mercado-libre-1.svg',
      cor: '#FFE600',
      icone: 'Truck',
      categoria: 'General Marketplace',
      tipo: 'marketplace-nacional',
      strategy: {
        trustLevel: 'intermediario',
        audienceProfile: 'conveniencia',
        buyingBehavior: 'pesquisa',
        conversionTriggers: ['entrega_rapida', 'full', 'garantia', 'vendedor_oficial'],
        recommendedStyle: 'custo_beneficio',
      },
    },
    amazon: {
      id: 'amazon',
      nome: 'Amazon',
      logo: 'https://cdn.worldvectorlogo.com/logos/amazon-icon.svg',
      cor: '#232F3E',
      icone: 'Package',
      categoria: 'Global Retail',
      tipo: 'marketplace-internacional',
      strategy: {
        trustLevel: 'premium',
        audienceProfile: 'qualidade_premium',
        buyingBehavior: 'fidelidade',
        conversionTriggers: ['prime', 'entrega_rapida', 'marca_oficial', 'qualidade'],
        recommendedStyle: 'premium',
      },
    },
    magalu: {
      id: 'magalu',
      nome: 'Magazine Luiza',
      logo: 'https://cdn.worldvectorlogo.com/logos/magazine-luiza.svg',
      cor: '#0086FF',
      icone: 'Store',
      categoria: 'Retail Nacional',
      tipo: 'marketplace-nacional',
      strategy: {
        trustLevel: 'intermediario',
        audienceProfile: 'conveniencia',
        buyingBehavior: 'pesquisa',
        conversionTriggers: ['retira_loja', 'parcelamento', 'garantia_nacional'],
        recommendedStyle: 'familia',
      },
    },
    aliexpress: {
      id: 'aliexpress',
      nome: 'AliExpress',
      logo: 'https://cdn.worldvectorlogo.com/logos/aliexpress-1.svg',
      cor: '#FF4747',
      icone: 'Globe',
      categoria: 'Cross-border',
      tipo: 'marketplace-internacional',
      strategy: {
        trustLevel: 'popular',
        audienceProfile: 'preco_competitivo',
        buyingBehavior: 'impulso',
        conversionTriggers: ['super_desconto', 'combo', 'choice', 'precinho'],
        recommendedStyle: 'explosiva',
      },
    },
    tiktokshop: {
      id: 'tiktokshop',
      nome: 'TikTok Shop',
      logo: 'https://cdn.worldvectorlogo.com/logos/tiktok-share-icon-white.svg',
      cor: '#000000',
      icone: 'Video',
      categoria: 'Social Commerce',
      tipo: 'social-commerce',
      strategy: {
        trustLevel: 'popular',
        audienceProfile: 'achados',
        buyingBehavior: 'impulso',
        conversionTriggers: ['viral', 'tendencia', 'cupom_exclusivo', 'live'],
        recommendedStyle: 'viralizar',
      },
    },
    shein: {
      id: 'shein',
      nome: 'Shein',
      logo: 'https://cdn.worldvectorlogo.com/logos/shein.svg',
      cor: '#000000',
      icone: 'Shirt',
      categoria: 'Fashion & Lifestyle',
      tipo: 'social-commerce',
      strategy: {
        trustLevel: 'popular',
        audienceProfile: 'preco_competitivo',
        buyingBehavior: 'impulso',
        conversionTriggers: ['look', 'tendencia', 'cupom', 'achadinho'],
        recommendedStyle: 'promocao',
      },
    },
  };

  public static getInstance(): MarketplaceConfigRegistry {
    if (!MarketplaceConfigRegistry.instance) {
      MarketplaceConfigRegistry.instance = new MarketplaceConfigRegistry();
    }
    return MarketplaceConfigRegistry.instance;
  }

  public registerCustomConfig(config: MarketplaceConfigDoc): void {
    const slug = config.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    this.customConfigs.set(slug, config);
  }

  public getContext(marketplaceSlug: string): MarketplaceContext {
    const normalized = (marketplaceSlug || 'generico').toLowerCase().replace(/[^a-z0-9]/g, '');
    const config = this.customConfigs.get(normalized) || this.defaultConfigs[normalized];

    if (config) {
      return {
        id: config.id,
        nome: config.nome,
        categoria: config.categoria || 'Marketplace Geral',
        tipo: config.tipo || 'e-commerce',
        identidadeVisual: {
          nome: config.nome,
          cor: config.cor,
          logo: config.logo,
          icone: config.icone,
        },
        strategy: config.strategy,
      };
    }

    // Fallback gracioso para novos marketplaces nao cadastrados
    const capitalized = marketplaceSlug ? marketplaceSlug.charAt(0).toUpperCase() + marketplaceSlug.slice(1) : 'Marketplace';
    return {
      id: normalized || 'generico',
      nome: capitalized,
      categoria: 'Marketplace Geral',
      tipo: 'e-commerce',
      identidadeVisual: {
        nome: capitalized,
        cor: '#3B82F6',
        logo: '',
        icone: 'ShoppingBag',
      },
      strategy: {
        trustLevel: 'intermediario',
        audienceProfile: 'preco_competitivo',
        buyingBehavior: 'pesquisa',
        conversionTriggers: ['oferta', 'qualidade'],
        recommendedStyle: 'promocao',
      },
    };
  }
}
