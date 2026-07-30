import { ProductExtractionResult } from '../entities/ProductExtractionResult';
import { MarketplaceMentionMode } from '../entities/UniversalMarketplaceContext';
import { MarketplaceIntelligenceScore } from '../value-objects/MarketplaceIntelligenceScore';
import { MarketplaceDataValidator } from './MarketplaceDataValidator';
import { NegativeAIMemoryService } from './NegativeAIMemoryService';
import { PositiveAIMemoryService } from './PositiveAIMemoryService';
import { AffiliateTrustContextService } from './AffiliateTrustContextService';
import { MarketplaceConfigRegistry } from './MarketplaceConfigRegistry';
import { MarketplaceProfileService } from './MarketplaceProfileService';
import { MarketplaceMentionPolicy, MarketplaceMentionDecision } from './MarketplaceMentionPolicy';

export interface CopyCommercialStrategy {
  objetivoComercial: string;
  tomDeVoz: string;
  gatilhosPrimarios: string[];
  gatilhosFracos: string[];
  estrategiaGancho: string;
  quebraObjeções: string[];
  diretrizesConfianca: string[];
  purchaseConfidenceScore: number;
  regrasNegativas: string[];
  padroesPositivos: string[];
  intelligenceScore: MarketplaceIntelligenceScore;
  mentionDecision: MarketplaceMentionDecision;
  mentionModeDirectives: string;
}

export class CopyStrategyEngine {
  /**
   * Sintetiza uma estrategia comercial rica antes de disparar a requisicao para a IA.
   * Fase 2.5: integra MarketplaceProfileService, MarketplaceMentionPolicy,
   * PositiveAIMemoryService e purchaseConfidenceScore.
   */
  public static async buildStrategy(params: {
    product: ProductExtractionResult;
    style: string;
    mentionMode?: MarketplaceMentionMode;
  }): Promise<CopyCommercialStrategy> {
    const { product, style, mentionMode = 'AUTO' } = params;

    const registry = MarketplaceConfigRegistry.getInstance();
    const marketplaceContext = registry.getContext(product.marketplace);
    const intelligenceScore = MarketplaceIntelligenceScore.getByMarketplace(product.marketplace);
    const profile = MarketplaceProfileService.getProfile(product.marketplace);
    const offerContext = MarketplaceDataValidator.validateAndBuildOfferContext(product);
    const trustResult = AffiliateTrustContextService.buildTrustDirectives(product);

    // Paralelo: Memória negativa + positiva
    const [negativeRules, padroesPositivos] = await Promise.all([
      NegativeAIMemoryService.getNegativeRules(product.marketplace, product.category || 'Geral'),
      PositiveAIMemoryService.getPositivePatterns(product.marketplace, product.category || 'Geral'),
    ]);

    // ── DECISÃO DE MENÇÃO DESACOPLADA (MarketplaceMentionPolicy) ──
    const mentionDecision = MarketplaceMentionPolicy.evaluate({
      marketplaceSlug: product.marketplace,
      style,
      mode: mentionMode,
    });

    // ── DEFINIÇÃO DINÂMICA DO OBJETIVO & TOM ──
    let objetivoComercial = 'Aumentar Cliques e Conversão';
    let tomDeVoz = 'Equilibrado, Persuasivo e Transparente';
    let estrategiaGancho = 'Apresentar a dor do consumidor seguida da solução perfeita';

    if (style === 'premium' || style === 'luxo' || profile.personalidade === 'sofisticada') {
      objetivoComercial = 'Elevar Valor Percebido e Desejo de Posse';
      tomDeVoz = 'Sofisticado, Elegante e Exclusivo';
      estrategiaGancho = 'Destaque no acabamento, qualidade superior e experiência única';
    } else if (style === 'explosiva' || style === 'urgencia' || intelligenceScore.urgencyScore > 85) {
      objetivoComercial = 'Geração de Escassez e Ação Imediata';
      tomDeVoz = 'Energético, Urgente e Impactante';
      estrategiaGancho = 'Alerta de oportunidade por tempo limitado que está se esgotando';
    } else if (style === 'promocao' || style === 'custo_beneficio' || intelligenceScore.priceSensitivity > 85) {
      objetivoComercial = 'Demonstração de Oportunidade e Compra Inteligente';
      tomDeVoz = 'Direto, Promocional e Focado na Economia Real';
      estrategiaGancho = 'Comparativo de desconto e valor promocional imperdível';
    } else if (profile.personalidade === 'viral') {
      objetivoComercial = 'Viralização e Engajamento Social';
      tomDeVoz = 'Descontraído, Autêntico e Pessoal (tom de recomendação de amigo)';
      estrategiaGancho = '"Achei isso aqui e tive que compartilhar..." — Recomendação orgânica e sincera';
    }

    return {
      objetivoComercial,
      tomDeVoz,
      gatilhosPrimarios: profile.gatilhosFortes,
      gatilhosFracos: profile.gatilhosFracos,
      estrategiaGancho,
      quebraObjeções: [
        'Garantia de produto autêntico',
        'Demonstração de excelente custo-benefício',
        'Facilidade de pagamento e parcelamento',
      ],
      diretrizesConfianca: trustResult.trustDirectives,
      purchaseConfidenceScore: trustResult.purchaseConfidenceScore,
      regrasNegativas: negativeRules,
      padroesPositivos,
      intelligenceScore,
      mentionDecision,
      mentionModeDirectives: mentionDecision.formattedMentionDirective,
    };
  }

  /**
   * Constrói o bloco formatado da estratégia comercial para ser injetado no prompt do Gemini.
   */
  public static formatStrategyPromptBlock(strategy: CopyCommercialStrategy): string {
    const blocks: string[] = [];

    blocks.push(`━━━ 🧠 PLANO ESTRATÉGICO COMERCIAL DO COPYSTRATEGYENGINE ━━━`);
    blocks.push(`• Objetivo Comercial: ${strategy.objetivoComercial}`);
    blocks.push(`• Tom de Voz Selecionado: ${strategy.tomDeVoz}`);
    blocks.push(`• Estratégia de Gancho (Hook): ${strategy.estrategiaGancho}`);
    blocks.push(`• Gatilhos Primários Ativos: ${strategy.gatilhosPrimarios.join(', ')}`);
    blocks.push(`• Gatilhos Fracos (Evitar): ${strategy.gatilhosFracos.join(', ') || 'Nenhum'}`);
    blocks.push(`• Diretriz de Menção ao Canal: ${strategy.mentionModeDirectives}`);
    blocks.push(`• Purchase Confidence Score: ${strategy.purchaseConfidenceScore}/100`);

    if (strategy.diretrizesConfianca.length > 0) {
      blocks.push(`\n🛡️ DIRETRIZES DE CONFIANÇA VERIFICADAS:\n${strategy.diretrizesConfianca.join('\n')}`);
    }

    if (strategy.padroesPositivos.length > 0) {
      blocks.push(`\n✅ PADRÕES VENCEDORES (APRENDER & APLICAR):\n${strategy.padroesPositivos.join('\n')}`);
    }

    if (strategy.regrasNegativas.length > 0) {
      blocks.push(`\n🚫 REGRAS NEGATIVAS (O QUE JAMAIS FAZER):\n${strategy.regrasNegativas.join('\n')}`);
    }

    return blocks.join('\n');
  }
}
