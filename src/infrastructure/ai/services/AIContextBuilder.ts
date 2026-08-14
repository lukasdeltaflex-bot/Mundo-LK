import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';
import { UserAIPreferences } from '../../../core/domain/services/UserAIPreferencesService';
import { MarketplaceAIMemory } from '../../../core/domain/services/MarketplaceAIMemoryService';
import { CategoryAIMemory } from '../../../core/domain/services/CategoryAIMemoryService';
import { MarketplaceMentionMode, MarketplaceContext, OfferContext } from '../../../core/domain/entities/UniversalMarketplaceContext';
import { MarketplaceConfigRegistry } from '../../../core/domain/services/MarketplaceConfigRegistry';
import { MarketplaceDataValidator } from '../../../core/domain/services/MarketplaceDataValidator';
import { MarketplaceProfileService } from '../../../core/domain/services/MarketplaceProfileService';
import { MarketplaceMentionPolicy } from '../../../core/domain/services/MarketplaceMentionPolicy';
import { CopyStrategyEngine, CopyCommercialStrategy } from '../../../core/domain/services/CopyStrategyEngine';
import { MarketplaceIntelligenceScore } from '../../../core/domain/value-objects/MarketplaceIntelligenceScore';

export interface AIProductContext {
  nome: string;
  descricao?: string;
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
  atributos?: Record<string, string>;
  especificacoes?: string[];
}

export class AIContextBuilder {
  public static readonly CONTEXT_VERSION = 2;

  public buildCleanContext(product: ProductExtractionResult): AIProductContext {
    const precoAtual = product.currentPrice ? `R$ ${product.currentPrice.toFixed(2).replace('.', ',')}` : 'Preço sob consulta';
    const precoAntigo = product.originalPrice ? `R$ ${product.originalPrice.toFixed(2).replace('.', ',')}` : undefined;
    const desconto = product.discountPercentage > 0 ? `${product.discountPercentage}% OFF` : 'Sem desconto registrado';

    return {
      nome: product.title.slice(0, 150).trim(),
      descricao: product.description,
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
      atributos: product.attributes,
      especificacoes: product.specifications,
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

    // 1. DADOS DE CATÁLOGO DA OFERTA (OfferContext + Detalhes do Produto)
    let productDetailsStr = `DADOS DA OFERTA (OFFER CONTEXT):
- Produto: ${offerContext.title}
- Marca: ${product.brand || 'Não especificada'}
- Categoria: ${product.category || 'Geral'}
- Preço Atual: ${offerContext.currentPrice}
${offerContext.previousPrice ? `- Preço Anterior: ${offerContext.previousPrice}` : ''}
${offerContext.discountPercentage ? `- Desconto Confirmado: ${offerContext.discountPercentage}` : ''}
- Descrição Oficial: ${product.description || 'Nenhuma descrição estendida fornecida'}`;

    if (product.attributes && Object.keys(product.attributes).length > 0) {
      const attrsFormatted = Object.entries(product.attributes)
        .map(([k, v]) => `  • ${k}: ${v}`)
        .join('\n');
      productDetailsStr += `\n- Atributos Confirmados:\n${attrsFormatted}`;
    }

    if (product.specifications && product.specifications.length > 0) {
      productDetailsStr += `\n- Especificações Técnicas:\n${product.specifications.map(s => `  • ${s}`).join('\n')}`;
    }

    blocks.push(productDetailsStr);

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
${context.descricao ? `- Descrição Oficial: ${context.descricao}` : ''}
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
      const keywordsStr = userPrefs.customKeywords && userPrefs.customKeywords.length > 0 ? `\n- Vocabulário Preferido: ${userPrefs.customKeywords.join(', ')}` : '';
      const avoidStr = userPrefs.learnedAvoidTerms && userPrefs.learnedAvoidTerms.length > 0 ? `\n- Termos a Evitar: ${userPrefs.learnedAvoidTerms.join(', ')}` : '';

      blocks.push(`━━━ HIERARQUIA 1: PREFERÊNCIAS HISTÓRICAS DO USUÁRIO (Confiança: ${userPrefs.confidenceScore}%) ━━━
- Emojis: ${userPrefs.preferEmojiDensity.toUpperCase()}
- Extensão: ${userPrefs.preferLength.toUpperCase()}
- Tom: ${userPrefs.tonePreference.toUpperCase()}
- Evitar Clichês: SIM${keywordsStr}${avoidStr}`);
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

  /**
   * Fase 2.5 — Constrói o payload unificado "Gemini Brain" com:
   * product, marketplace (profile + scores + trust + mentionPolicy), affiliate e strategy.
   * Esse é o "cérebro" estruturado enviado ao Gemini.
   */
  public async buildEnrichedBrainPayload(params: {
    product: ProductExtractionResult;
    style: string;
    mentionMode?: MarketplaceMentionMode;
  }): Promise<string> {
    const { product, style, mentionMode = 'AUTO' } = params;

    const registry = MarketplaceConfigRegistry.getInstance();
    const marketplaceCtx: MarketplaceContext = registry.getContext(product.marketplace);
    const offerCtx: OfferContext = MarketplaceDataValidator.validateAndBuildOfferContext(product);
    const profile = MarketplaceProfileService.getProfile(product.marketplace);
    const scores = MarketplaceIntelligenceScore.getByMarketplace(product.marketplace);
    const mentionPolicy = MarketplaceMentionPolicy.evaluate({ marketplaceSlug: product.marketplace, style, mode: mentionMode });
    const strategy: CopyCommercialStrategy = await CopyStrategyEngine.buildStrategy({ product, style, mentionMode });

    const blocks: string[] = [];

    blocks.push(`[META INFO: contextVersion=${AIContextBuilder.CONTEXT_VERSION} | engine=GeminiBrain-Phase2.5]`);

    // ── BLOCO 1: PRODUTO ──
    let productBlock = `━━━ 📦 PRODUTO (FATOS REAIS INEGOCIÁVEIS) ━━━
• Nome: ${offerCtx.title}
• Marca: ${product.brand || 'Não especificada'}
• Categoria: ${product.category || 'Geral'}
• Preço Atual: ${offerCtx.currentPrice}${offerCtx.previousPrice ? ` (anterior: ${offerCtx.previousPrice})` : ''}
${offerCtx.discountPercentage ? `• Desconto Confirmado: ${offerCtx.discountPercentage}` : ''}
• Descrição Oficial do Produto: "${product.description || 'Descrição indisponível'}"`;

    if (product.attributes && Object.keys(product.attributes).length > 0) {
      const attrsStr = Object.entries(product.attributes)
        .map(([k, v]) => `  - ${k}: ${v}`)
        .join('\n');
      productBlock += `\n• Atributos Confirmados:\n${attrsStr}`;
    }

    if (product.specifications && product.specifications.length > 0) {
      productBlock += `\n• Especificações Técnicas:\n${product.specifications.map(s => `  - ${s}`).join('\n')}`;
    }

    blocks.push(productBlock);

    // ── BLOCO 2: MARKETPLACE (Perfil + Scores + Menção) ──
    blocks.push(`━━━ 🏪 MARKETPLACE ━━━
• Canal: ${marketplaceCtx.nome} (${marketplaceCtx.tipo})
• Perfil Comercial: ${profile.perfil.toUpperCase()} | Personalidade: ${profile.personalidade.toUpperCase()}
• Scores Comerciais:
  - Trust Score: ${scores.trustScore}/100
  - Price Sensitivity: ${scores.priceSensitivity}/100
  - Urgency Score: ${scores.urgencyScore}/100
  - Premium Score: ${scores.premiumScore}/100
  - Delivery Score: ${scores.deliveryScore}/100
  - Social Proof Score: ${scores.socialProofScore}/100
  - Affiliate Conversion Score: ${scores.affiliateConversionScore}/100
• Gatilhos Fortes: ${profile.gatilhosFortes.join(', ')}
• Gatilhos Fracos (Evitar): ${profile.gatilhosFracos.join(', ') || 'Nenhum'}
• Política de Menção: ${mentionPolicy.mode} → ${mentionPolicy.reason}`);

    // ── BLOCO 3: AFILIADO (Trust + Confidence) ──
    blocks.push(`━━━ 🤝 AFILIADO & CONFIANÇA ━━━
• Purchase Confidence Score: ${strategy.purchaseConfidenceScore}/100
• Frases de Confiança Autorizadas: ${strategy.purchaseConfidenceScore >= 70 ? 'SIM' : 'NÃO'}
${strategy.diretrizesConfianca.join('\n')}`);

    // ── BLOCO 4: ESTRATÉGIA DE VENDAS (CopyStrategyEngine) ──
    blocks.push(CopyStrategyEngine.formatStrategyPromptBlock(strategy));

    // ── BLOCO 5: ANTI-HALUCINAÇÃO ──
    blocks.push(MarketplaceDataValidator.buildAntiHallucinationInstructions(offerCtx.dadosComerciaisValidados));

    return blocks.join('\n\n');
  }
}

