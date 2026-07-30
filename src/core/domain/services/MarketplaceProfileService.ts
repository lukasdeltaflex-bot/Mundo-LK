import { MarketplaceIntelligenceScore } from '../value-objects/MarketplaceIntelligenceScore';

export interface MarketplaceProfile {
  id: string;
  nome: string;
  perfil: 'promocao' | 'custo_beneficio' | 'premium' | 'social';
  personalidade: 'popular' | 'intermediaria' | 'sofisticada' | 'viral';
  gatilhosFortes: string[];
  gatilhosFracos: string[];
}

export class MarketplaceProfileService {
  public static getProfile(marketplaceSlug: string): MarketplaceProfile {
    const s = (marketplaceSlug || 'generico').toLowerCase().replace(/[^a-z0-9]/g, '');
    const scores = MarketplaceIntelligenceScore.getByMarketplace(s);

    if (s === 'shopee') {
      return {
        id: 'shopee',
        nome: 'Shopee',
        perfil: 'promocao',
        personalidade: 'popular',
        gatilhosFortes: ['preco', 'cupom', 'frete_gratis', 'achadinho', 'urgencia'],
        gatilhosFracos: ['luxo', 'exclusividade', 'status'],
      };
    }

    if (s === 'amazon') {
      return {
        id: 'amazon',
        nome: 'Amazon',
        perfil: 'premium',
        personalidade: 'sofisticada',
        gatilhosFortes: ['autoridade', 'marca_oficial', 'entrega_expressa_prime', 'qualidade'],
        gatilhosFracos: ['precinho', 'barganha', 'desconto_bombastico'],
      };
    }

    if (s === 'mercadolivre') {
      return {
        id: 'mercadolivre',
        nome: 'Mercado Livre',
        perfil: 'custo_beneficio',
        personalidade: 'intermediaria',
        gatilhosFortes: ['entrega_rapida_full', 'vendedor_oficial', 'garantia_de_compra', 'confianca'],
        gatilhosFracos: ['exclusividade_extrema'],
      };
    }

    if (s === 'tiktokshop' || s === 'shein') {
      return {
        id: s,
        nome: s === 'shein' ? 'Shein' : 'TikTok Shop',
        perfil: 'social',
        personalidade: 'viral',
        gatilhosFortes: ['tendencia', 'viral', 'cupom_exclusivo', 'look', 'achadinho'],
        gatilhosFracos: ['tradicao', 'garantia_institucional'],
      };
    }

    // Algoritmo dinâmico interpretativo para marketplaces genéricos
    if (scores.premiumScore > 80) {
      return {
        id: s,
        nome: marketplaceSlug,
        perfil: 'premium',
        personalidade: 'sofisticada',
        gatilhosFortes: ['qualidade', 'marca', 'exclusividade'],
        gatilhosFracos: ['precinho'],
      };
    }

    if (scores.priceSensitivity > 85) {
      return {
        id: s,
        nome: marketplaceSlug,
        perfil: 'promocao',
        personalidade: 'popular',
        gatilhosFortes: ['desconto', 'cupom', 'oportunidade'],
        gatilhosFracos: ['status'],
      };
    }

    return {
      id: s,
      nome: marketplaceSlug,
      perfil: 'custo_beneficio',
      personalidade: 'intermediaria',
      gatilhosFortes: ['confianca', 'utilidade', 'preco_justo'],
      gatilhosFracos: [],
    };
  }
}
