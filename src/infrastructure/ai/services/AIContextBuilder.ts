import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';
import { UserAIPreferences } from '../../../core/domain/services/UserAIPreferencesService';
import { MarketplaceAIMemory } from '../../../core/domain/services/MarketplaceAIMemoryService';
import { CategoryAIMemory } from '../../../core/domain/services/CategoryAIMemoryService';
import { MarketplaceMentionMode, MarketplaceContext, OfferContext } from '../../../core/domain/entities/UniversalMarketplaceContext';
import { MarketplaceConfigRegistry } from '../../../core/domain/services/MarketplaceConfigRegistry';
import { MarketplaceDataValidator } from '../../../core/domain/services/MarketplaceDataValidator';

export interface AIProductContext {
  nome: string;
  precoAtual: string;
  precoAntigo?: string;
  desconto: string;
  marketplace: string;
  categoria: string;
  marca: string;
  frete: string;
  cupom?: string;
  avaliacao?: string;
  imagemUrl: string;
  linkOriginal: string;
}

export class AIContextBuilder {
  public static readonly CONTEXT_VERSION = 2;

  public buildCleanContext(product: ProductExtractionResult): AIProductContext {
    const precoAtual = product.currentPrice ? `R$ ${product.currentPrice.toFixed(2).replace('.', ',')}` : 'Preço sob consulta';
    const precoAntigo = product.originalPrice ? `R$ ${product.originalPrice.toFixed(2).replace('.', ',')}` : undefined;
    const desconto = product.discountPercentage > 0 ? `${product.discountPercentage}% OFF` : 'Sem desconto registrado';

    return {
      nome: product.title.slice(0, 150).trim(),
      precoAtual,
      precoAntigo,
      desconto,
      marketplace: product.marketplace,
      categoria: product.category || 'Geral',
      marca: product.brand || 'Desconhecida',
      frete: product.shippingType || (product.freeShipping ? 'Frete Grátis' : 'Envio Padrão'),
      cupom: product.coupon || undefined,
      avaliacao: product.rating > 0 ? `${product.rating} / 5 (${product.reviewCount} avaliações)` : undefined,
      imagemUrl: product.image,
      linkOriginal: product.originalUrl || product.canonicalUrl,
    };
  }

  /**
   * Constrói o contexto enriquecido multimarketplace separando MarketplaceContext de OfferContext.
   */
  public buildUniversalMarketplacePrompt(
    product: ProductExtractionResult,
    mentionMode: MarketplaceMentionMode = 'AUTO'
  ): string {
    const registry = MarketplaceConfigRegistry.getInstance();
    const marketplaceContext: MarketplaceContext = registry.getContext(product.marketplace);
    const offerContext: OfferContext = MarketplaceDataValidator.validateAndBuildOfferContext(product);

    const blocks: string[] = [];

    // 1. DADOS DE CATÁLOGO DA OFERTA (OfferContext)
    blocks.push(`DADOS DA OFERTA (OFFER CONTEXT):
- Produto: ${offerContext.title}
- Preço Atual: ${offerContext.currentPrice}
${offerContext.previousPrice ? `- Preço Anterior: ${offerContext.previousPrice}` : ''}
${offerContext.discountPercentage ? `- Desconto Confirmado: ${offerContext.discountPercentage}` : ''}
- Marca: ${product.brand || 'Não especificada'}
- Categoria: ${product.category || 'Geral'}`);

    // 2. DADOS DO MARKETPLACE E ESTRATÉGIA COMERCIAL (MarketplaceContext)
    blocks.push(`INTELIGÊNCIA DO CANAL (MARKETPLACE CONTEXT):
- Canal de Origem: ${marketplaceContext.nome} (${marketplaceContext.tipo})
- Nível de Confiança do Canal: ${marketplaceContext.strategy.trustLevel.toUpperCase()}
- Perfil do Público: ${marketplaceContext.strategy.audienceProfile.toUpperCase()}
- Comportamento de Compra: ${marketplaceContext.strategy.buyingBehavior.toUpperCase()}
- Gatilhos de Conversão Recomendados: ${marketplaceContext.strategy.conversionTriggers.join(', ')}`);

    // 3. REGRAS DO MODO DE MENÇÃO DO MARKETPLACE
    blocks.push(`DIRETRIZ DE MENÇÃO DO MARKETPLACE (Modo: ${mentionMode}):`);
    if (mentionMode === 'ALWAYS') {
      blocks.push(`- OBRIGATÓRIO: Incluir referência explícita ao marketplace "${marketplaceContext.nome}" na copy de forma estratégica (ex: "🛒 Oferta disponível na ${marketplaceContext.nome}").`);
    } else if (mentionMode === 'NEVER') {
      blocks.push(`- PROIBIDO: NUNCA citar explicitamente o nome "${marketplaceContext.nome}" no texto. Utilize os dados de preço e frete apenas como inteligência comercial interna.`);
    } else {
      // AUTO
      blocks.push(`- MODO INTELIGENTE (AUTO): Decida autonomamente se citar a "${marketplaceContext.nome}" melhora a conversão.
  • Em produtos promocionais/custo-benefício: Pode utilizar a "${marketplaceContext.nome}" como elemento de prova social/confiança.
  • Em produtos premium/luxo: Evite menções repetitivas ao marketplace para focar na exclusividade e qualidade do produto.`);
    }

    // 4. INSTRUÇÕES ANTI-HALUCINAÇÃO DADOS COMERCIAIS
    blocks.push(MarketplaceDataValidator.buildAntiHallucinationInstructions(offerContext.dadosComerciaisValidados));

    return blocks.join('\n\n');
  }

  public formatPromptString(context: AIProductContext): string {
    return `
DADOS CONFIRMADOS DO PRODUTO:
- Nome: ${context.nome}
- Preço Atual: ${context.precoAtual}
${context.precoAntigo ? `- Preço Anterior: ${context.precoAntigo}` : ''}
- Desconto: ${context.desconto}
- Marketplace: ${context.marketplace}
- Categoria: ${context.categoria}
- Marca: ${context.marca}
- Frete: ${context.frete}
${context.cupom ? `- Cupom: ${context.cupom}` : ''}
${context.avaliacao ? `- Avaliação: ${context.avaliacao}` : ''}
`.trim();
  }

  /**
   * Formats consolidated multi-layered prompt context with Context Cap (Top 3) and contextVersion: 2
   */
  public buildConsolidatedPromptContext(params: {
    userPrefs: UserAIPreferences | null;
    winningStrategiesPrompt: string;
    marketplaceMem: MarketplaceAIMemory;
    categoryMem: CategoryAIMemory;
    diversityScore?: number;
  }): string {
    const { userPrefs, winningStrategiesPrompt, marketplaceMem, categoryMem, diversityScore = 85 } = params;
    const blocks: string[] = [];

    blocks.push(`[META INFO: contextVersion=${AIContextBuilder.CONTEXT_VERSION}]`);

    // 1. User Preferences (Highest Priority)
    if (userPrefs) {
      blocks.push(`━━━ HIERARQUIA 1: PREFERÊNCIAS HISTÓRICAS DO USUÁRIO (Confiança: ${userPrefs.confidenceScore}%) ━━━
- Emojis: ${userPrefs.preferEmojiDensity.toUpperCase()}
- Extensão: ${userPrefs.preferLength.toUpperCase()}
- Tom: ${userPrefs.tonePreference.toUpperCase()}
- Evitar Clichês: SIM`);
    }

    // 2. Winning Strategies (Top 3 Cap)
    if (winningStrategiesPrompt) {
      blocks.push(`━━━ HIERARQUIA 2: ESTRATÉGIAS VENCEDORAS (TOP 3 COMPROVADAS) ━━━\n${winningStrategiesPrompt}`);
    }

    // 3. Marketplace Memory
    blocks.push(`━━━ HIERARQUIA 3: MEMÓRIA DO MARKETPLACE (${marketplaceMem.marketplaceSlug.toUpperCase()}) ━━━
- Extensão: ${marketplaceMem.copyLengthStyle.toUpperCase()}
- Emojis: ${marketplaceMem.emojiUsage.toUpperCase()}
- Urgência: ${marketplaceMem.urgencyLevel.toUpperCase()}
- Foco: ${marketplaceMem.focusPillars.join(', ')}`);

    // 4. Category Memory
    blocks.push(`━━━ HIERARQUIA 4: MEMÓRIA DA CATEGORIA (${categoryMem.categoryId.toUpperCase()}) ━━━
- Vocabulário: ${categoryMem.keyVocabulary.join(', ')}
- Dor Solucionada: "${categoryMem.primaryPainPoint}"
- Gatilhos: ${categoryMem.conversionTriggers.join(', ')}`);

    // Anti-overfitting directive
    if (diversityScore < 60) {
      blocks.push(`⚠️ DIRETRIZ ANTI-OVERFITTING (Diversidade: ${diversityScore}%):
Utilize o mesmo ângulo comercial recomendado, mas varie a estrutura de frases e a escolha dos sinônimos para evitar repetição excessiva.`);
    }

    return blocks.join('\n\n');
  }
}

