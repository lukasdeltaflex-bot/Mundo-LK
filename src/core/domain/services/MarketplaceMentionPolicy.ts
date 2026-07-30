import { MarketplaceMentionMode } from '../entities/UniversalMarketplaceContext';
import { MarketplaceProfileService } from './MarketplaceProfileService';

export interface MarketplaceMentionDecision {
  mode: MarketplaceMentionMode;
  allowed: boolean;
  reason: string;
  formattedMentionDirective: string;
}

export class MarketplaceMentionPolicy {
  public static evaluate(params: {
    marketplaceSlug: string;
    style: string;
    mode?: MarketplaceMentionMode;
  }): MarketplaceMentionDecision {
    const { marketplaceSlug, style, mode = 'AUTO' } = params;
    const profile = MarketplaceProfileService.getProfile(marketplaceSlug);

    if (mode === 'ALWAYS') {
      return {
        mode: 'ALWAYS',
        allowed: true,
        reason: 'Modo ALWAYS configurado explicitamente pelo usuário.',
        formattedMentionDirective: `OBRIGATÓRIO: Mencione explicitamente o nome "${profile.nome}" na copy como fonte oficial da oferta (ex: "🛒 Disponível na ${profile.nome}").`,
      };
    }

    if (mode === 'NEVER') {
      return {
        mode: 'NEVER',
        allowed: false,
        reason: 'Modo NEVER configurado explicitamente para preservar a copy limpa sem citar o canal.',
        formattedMentionDirective: `PROIBIDO: Não mencione explicitamente o nome "${profile.nome}" no texto. Utilize os dados de preço e frete apenas como inteligência comercial interna.`,
      };
    }

    // ── MODO AUTO (INTELIGENTE) ──
    const isPremiumStyle = style === 'premium' || style === 'luxo' || profile.personalidade === 'sofisticada';

    if (isPremiumStyle) {
      return {
        mode: 'AUTO',
        allowed: false,
        reason: 'Preservar percepção de valor e exclusividade premium (evitar poluição com o nome do marketplace).',
        formattedMentionDirective: `MODO AUTO (Elegante): Omita a menção direta ao nome "${profile.nome}" no corpo do anúncio para focar no status, qualidade e sofisticação do produto.`,
      };
    }

    return {
      mode: 'AUTO',
      allowed: true,
      reason: `Marketplace "${profile.nome}" possui apelo ${profile.personalidade} e fortalece a prova social da oferta.`,
      formattedMentionDirective: `MODO AUTO (Estratégico): Você pode citar a "${profile.nome}" como elemento de prova social e confiança (ex: "🛒 Oferta encontrada na ${profile.nome}").`,
    };
  }
}
