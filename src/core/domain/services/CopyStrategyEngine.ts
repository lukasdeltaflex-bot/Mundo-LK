import { ProductExtractionResult } from '../entities/ProductExtractionResult';
import { MarketplaceMentionMode } from '../entities/UniversalMarketplaceContext';
import { MarketplaceIntelligenceScore } from '../value-objects/MarketplaceIntelligenceScore';
import { MarketplaceDataValidator } from './MarketplaceDataValidator';
import { NegativeAIMemoryService } from './NegativeAIMemoryService';
import { AffiliateTrustContextService } from './AffiliateTrustContextService';
import { MarketplaceConfigRegistry } from './MarketplaceConfigRegistry';

export interface CopyCommercialStrategy {
  objetivoComercial: string;
  tomDeVoz: string;
  gatilhosPrimarios: string[];
  estrategiaGancho: string;
  quebraObjeções: string[];
  diretrizesConfianca: string[];
  regrasNegativas: string[];
  intelligenceScore: MarketplaceIntelligenceScore;
  mentionModeDirectives: string;
}

export class CopyStrategyEngine {
  /**
   * Sintetiza uma estrategia comercial rica antes de disparar a requisicao para a IA.
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
    const offerContext = MarketplaceDataValidator.validateAndBuildOfferContext(product);
    const trustDirectives = AffiliateTrustContextService.buildTrustDirectives(product);
    const negativeRules = await NegativeAIMemoryService.getNegativeRules(product.marketplace, product.category || 'Geral');

    // ── DEFINIÇÃO DINÂMICA DO OBJETIVO & TOM ──
    let objetivoComercial = 'Aumentar Cliques e Conversão';
    let tomDeVoz = 'Equilibrado, Persuasivo e Transparente';
    let estrategiaGancho = 'Apresentar a dor do consumidor seguida da solução perfeita';

    if (style === 'premium' || style === 'luxo' || intelligenceScore.premiumScore > 85) {
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
    }

    // ── DIRETRIZ DE MENÇÃO DO MARKETPLACE ──
    let mentionModeDirectives = '';
    if (mentionMode === 'ALWAYS') {
      mentionModeDirectives = `OBRIGATÓRIO: Mencione a ${marketplaceContext.nome} como a loja/canal oficial do produto.`;
    } else if (mentionMode === 'NEVER') {
      mentionModeDirectives = `PROIBIDO: Não cite o nome "${marketplaceContext.nome}" no texto. Foque exclusivamente no produto.`;
    } else {
      // AUTO
      if (style === 'premium' || style === 'luxo') {
        mentionModeDirectives = `MODO AUTO (Elegante): Evite menção desnecessária ao marketplace "${marketplaceContext.nome}" para focar no status e qualidade do produto.`;
      } else {
        mentionModeDirectives = `MODO AUTO (Estratégico): Você pode citar a "${marketplaceContext.nome}" como garantia de entrega e prova social caso aumente a conversão.`;
      }
    }

    return {
      objetivoComercial,
      tomDeVoz,
      gatilhosPrimarios: marketplaceContext.strategy.conversionTriggers,
      estrategiaGancho,
      quebraObjeções: [
        'Garantia de produto autêntico',
        'Demonstração de excelente custo-benefício',
        'Facilidade de pagamento e parcelamento',
      ],
      diretrizesConfianca: trustDirectives.trustDirectives,
      regrasNegativas: negativeRules,
      intelligenceScore,
      mentionModeDirectives,
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
    blocks.push(`• Gatilhos Primários: ${strategy.gatilhosPrimarios.join(', ')}`);
    blocks.push(`• Diretriz de Menção ao Canal: ${strategy.mentionModeDirectives}`);

    if (strategy.diretrizesConfianca.length > 0) {
      blocks.push(`\n🛡️ DIRETRIZES DE CONFIANÇA VERIFICADAS:\n${strategy.diretrizesConfianca.join('\n')}`);
    }

    if (strategy.regrasNegativas.length > 0) {
      blocks.push(`\n🚫 REGRAS NEGATIVAS (O QUE JAMAIS FAZER):\n${strategy.regrasNegativas.join('\n')}`);
    }

    return blocks.join('\n');
  }
}
