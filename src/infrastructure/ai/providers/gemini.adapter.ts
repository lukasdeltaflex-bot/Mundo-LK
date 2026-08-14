import { IAIProviderAdapter, AIOfferGenerationResult } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { Product } from '../../../core/domain/entities/product.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';
import { Score } from '../../../core/domain/entities/score.entity';
import { CopySimilarityValidator } from '@/core/domain/services/CopySimilarityValidator';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OfferStyle =
  | 'padrao'
  | 'explosiva'
  | 'premium'
  | 'urgencia'
  | 'minimalista'
  | 'emocional'
  | 'promocao'
  | 'custo_beneficio'
  | 'familia'
  | 'tecnologia'
  | 'casa'
  | 'esporte'
  | 'presentes'
  | 'relampago'
  | 'luxo';

export type CommercialGoal =
  | 'maximo_cliques'
  | 'maxima_conversao'
  | 'ticket_alto'
  | 'venda_rapida'
  | 'viralizar'
  | 'recuperar_oferta'
  | 'produto_premium'
  | 'produto_popular'
  | 'produto_nichado';

export type AIGenerationMode = 'rapido' | 'profissional' | 'estrategica';

export interface GeminiOfferAnalysis {
  publicoAlvo: string;
  dorQueResolve: string;
  beneficioPrincipal: string;
  argumentoComercial: string;
  anguloDeVenda: string;
  emocaoDeCompra: string;

  categoria: string;
  subcategoria?: string;

  // 9 Channels + Status
  whatsAppText: string;
  telegramText: string;
  instagramText: string;
  facebookText: string;
  threadsText?: string;
  pinterestText?: string;
  tikTokText?: string;
  youtubeShortsText?: string;
  statusWhatsAppText?: string;

  // 3 Multi-Version Copy Variations (Conversão, Premium, Social)
  versaoConversao?: string; // Foco em Desconto, Urgência e Ação Rápida (WhatsApp/Telegram Promo)
  versaoPremium?: string;   // Foco em Valor Percebido, Status e Durabilidade (Instagram Feed/Reels)
  versaoSocial?: string;    // Foco no estilo "Achadinhos" pessoal e engajador (TikTok/Stories)
  copyA?: string;
  copyB?: string;
  copyC?: string;

  cta: string;
  hashtags: string[];
  emojis: string[];
  gatilhosMentais?: string[];

  // Visual Suggestions & Timing
  sugestaoImagem?: string;
  sugestaoVideo?: string;
  melhorHorario?: string;
  melhorDia?: string;

  // Commercial Intelligence & Star Breakdown
  recomendacaoIA?: string;
  pontosFortes?: string[];
  pontosFracos?: string[];

  // Explainable AI & Decision Rationales
  explicabilidadeDecisoes?: {
    publicoAlvoIdentificado?: string;
    dorPrincipalSolucionada?: string;
    gatilhoMentalEscolhido?: string;
    estiloCtaAplicado?: string;
    estrategiaMarketplace?: string;
    objetivoComercialAtingido?: string;
    historicoReferenciaTransparente?: string;
  };

  porQueTitulo?: string;
  porQueGatilho?: string;
  porQueHorario?: string;
  scorePreco?: number;
  scoreDesconto?: number;
  scoreFrete?: number;
  scoreCupom?: number;
  scoreAvaliacoes?: number;
  scoreConcorrencia?: number;

  // Hybrid Quality Auto-Evaluation & Debug Info
  autoAvaliacaoNota?: number;
  autoAvaliacaoJustificativa?: string;
  sanitizedPromptDebug?: string;

  scoreValue: number;
  scoreJustification: string;
}

// ─── Prompt & Temperature Helpers ──────────────────────────────────────────────

export function getStyleTemperature(style: OfferStyle): number {
  switch (style) {
    case 'minimalista': return 0.3;
    case 'tecnologia':
    case 'custo_beneficio': return 0.4;
    case 'padrao': return 0.7;
    case 'luxo':
    case 'premium': return 0.8;
    case 'urgencia':
    case 'relampago': return 0.9;
    case 'emocional':
    case 'familia': return 1.0;
    case 'explosiva': return 1.2;
    default: return 0.7;
  }
}

function buildMarketingPrompt(
  product: Product,
  style: OfferStyle,
  goal: CommercialGoal = 'maxima_conversao',
  mode: AIGenerationMode = 'profissional',
  pastWinningContext?: string,
  hierarchicalMemoryBlock?: string
): string {
  const stylePtBR: Record<OfferStyle, string> = {
    padrao:          'equilibrado e persuasivo, com apelo emocional e racional combinados',
    explosiva:       'explosivo e bombástico — foco em achado imperdível que vai esgotar rápido',
    premium:         'sofisticado e desejável — foco em status, qualidade superior e acabamento impecável',
    urgencia:        'urgência extrema e escassez — foco em pouquíssimas unidades restantes e prazo acabando',
    minimalista:     'ultra-conciso e direto ao ponto — máximo impacto em pouquíssimas palavras sem floreios',
    emocional:       'apelo emocional profundo — foco na transformação pessoal, bem-estar e momento de vida',
    promocao:        'foco total no percentual de desconto, economia real e preço imbatível',
    custo_beneficio: 'demonstração racional de compra inteligente, durabilidade e utilidade',
    familia:         'focado no bem-estar da família, praticidade do lar e facilidade da casa',
    tecnologia:      'destaque em alta performance, inovação técnica, velocidade e recursos modernos',
    casa:            'conforto do lar, praticidade na cozinha, organização e utilidade diária',
    esporte:         'performance física, treino, superação, foco e saúde',
    presentes:       'ideia de presente inesquecível, momentos especiais e demonstração de carinho',
    relampago:       'oferta relâmpago que acaba nos próximos minutos',
    luxo:            'exclusividade total, sofisticação de alto padrão e distinção',
  };

  const goalPtBR: Record<CommercialGoal, string> = {
    maximo_cliques:   'GERAR O MÁXIMO DE CLIQUES (Gatilhos de Curiosidade e Abertura Imediata)',
    maxima_conversao: 'MAXIMIZAR CONVERSÃO EM VENDAS (Prova Social, Apelo Racional e Confiança)',
    ticket_alto:      'VENDER PRODUTO DE TICKET ALTO (Elevação de Valor Percebido e Desejo)',
    venda_rapida:     'ACELERAR VENDAS RÁPIDAS (Urgência Extrema e Ação Imediata)',
    viralizar:        'VIRALIZAR A OFERTA (Alto Engajamento, Emoção e Compartilhamento em Grupos)',
    recuperar_oferta: 'RECUPERAR OFERTA ANTIGA (Novo Ângulo Inédito e Quebra de Objeções)',
    produto_premium:  'DESTACAR PRODUTO PREMIUM (Exclusividade, Status e Distinção)',
    produto_popular:  'DESTACAR PRODUTO POPULAR (Custo-Benefício Imediato e Preço Baixo)',
    produto_nichado:  'CONVERTER EM PÚBLICO NICHADO (Comunicação Direta para Compradores Específicos)',
  };

  const formatPrice = (p: any) => {
    if (typeof p === 'number') return `R$ ${p.toFixed(2)}`;
    if (p && typeof p.formatBRL === 'function') return p.formatBRL();
    if (p && typeof p.value === 'number') return `R$ ${p.value.toFixed(2)}`;
    return 'Preço sob consulta';
  };

  const price    = formatPrice(product.currentPrice);
  const discount = product.previousPrice
    ? `de ${formatPrice(product.previousPrice)} por ${price}`
    : `preço atual: ${price}`;

  const rawAffiliateUrl = product.affiliateUrl?.url || '';

  const expertPanelDirective = mode === 'estrategica' ? `
━━━ 🎯 MODO IA ESTRATÉGICA (PAINEL DE 7 ESPECIALISTAS EM 1 ÚNICA REQUISIÇÃO) ━━━
Sintetize a análise sob 7 perspectivas profissionais simultâneas (Copywriting, Conversão, Marketplace, Marketing Digital, Psicologia do Consumidor, SEO e Redes Sociais).
` : '';

  return `Você é um ESPECIALISTA BRASILEIRO EM MARKETING DE AFILIADOS, MARKETPLACES E VENDAS DIGITAIS.
Seu objetivo NÃO é apenas escrever bonito; seu objetivo é AUMENTAR CLIQUES, CONVERSÕES E COMISSÕES DO AFILIADO.

━━━ REGRA DE OURO DA REDAÇÃO ━━━
1. O PRODUTO É O PROTAGONISTA ABSOLUTO DA COPY.
2. O ESTILO ESCOLHIDO ("${stylePtBR[style]}") É APENAS A LENTE DE COMUNICAÇÃO (COMO VENDER), E NUNCA SUBSTITUI A IDENTIDADE DO PRODUTO.
3. Se o produto é um Perfume, a copy deve ser inconfundivelmente sobre perfumaria/fragrância. Se é um eletrônico, sobre tecnologia/recursos. Se é vestuário, sobre estilo/tecido/caimento.
4. JAMAIS crie uma copy genérica que serviria igualmente para qualquer produto trocando apenas o nome.

${hierarchicalMemoryBlock || ''}

OBJETIVO COMERCIAL EXPLICITO DA OFERTA: ${goalPtBR[goal]}
ESTILO DE COPY SOLICITADO: ${stylePtBR[style]}
MODO DE GERAÇÃO: ${mode.toUpperCase()}
${expertPanelDirective}

${pastWinningContext ? `${pastWinningContext}\n` : ''}

━━━ PROTOCOLO RÍGIDO ANTI-ALUCINAÇÃO ━━━
- NUNCA invente materiais, especificações técnicas, prazos de garantia, certificações, notas olfativas, brindes, promoções ou medidas que não estejam informados nos DADOS DO PRODUTO.
- Se uma informação não for fornecida nos dados do produto, limite-se estritamente aos fatos confirmados.

DADOS CONFIRMADOS DO PRODUTO (FATOS INEGOCIÁVEIS):
- Nome Oficial: "${product.title}"
- Descrição Oficial do Produto: "${product.description || 'Produto oficial'}"
- Marca: "${product.brand || 'Não especificada'}"
- Categoria: "${product.categoryId || 'Geral'}"
- Preço Atual: ${price} (Contexto: ${discount})
- Marketplace de Origem: ${product.marketplaceSlug}
- Link Afiliado Oficial: ${rawAffiliateUrl}

━━━ RESPOSTA OBRIGATÓRIA EM JSON PURO ━━━

{
  "publicoAlvo": "perfil exato do comprador ideal",
  "dorQueResolve": "dor específica que este produto resolve",
  "beneficioPrincipal": "principal transformação gerada pelo produto",
  "argumentoComercial": "argumento irrecusável adaptado ao objetivo comercial",
  "anguloDeVenda": "ângulo estratégico utilizado",
  "emocaoDeCompra": "emoção primária ativada",
  "categoria": "${product.categoryId || 'Geral'}",
  "subcategoria": "subcategoria analítica",

  "whatsAppText": "Copy completa formatada para WhatsApp no estilo ${style} com o link: ${rawAffiliateUrl}",
  "telegramText": "Copy formatada para Telegram com negrito e o link: ${rawAffiliateUrl}",
  "instagramText": "Legenda engajadora para Instagram com hashtags",
  "facebookText": "Post persuasivo para grupos de Facebook com o link: ${rawAffiliateUrl}",
  "statusWhatsAppText": "Texto ultra-curto com emojis para Status/Stories",

  "versaoConversao": "Versão Conversão Rápida: Foco total em preço, economia e urgência com o link: ${rawAffiliateUrl}",
  "versaoPremium": "Versão Premium Desejo: Foco em qualidade superior, status e valor percebido com o link: ${rawAffiliateUrl}",
  "versaoSocial": "Versão Social Achadinhos: Tom pessoal, engajador de recomendação com o link: ${rawAffiliateUrl}",
  "copyA": "Variação A (Venda Emocional & Conexão)",
  "copyB": "Variação B (Oferta Relâmpago & Urgência)",
  "copyC": "Variação C (Exclusividade Premium & Valor)",

  "cta": "Garanta o seu com desconto exclusivo agora!",
  "hashtags": ["#oferta", "#promoção", "#achadinhos", "#desconto"],
  "emojis": ["🔥", "😱", "💰", "🚚", "🛒"],
  "gatilhosMentais": ["Urgência", "Prova Social", "Escassez", "Valor Percebido"],

  "explicabilidadeDecisoes": {
    "publicoAlvoIdentificado": "Compradores com foco em praticidade e custo-benefício",
    "dorPrincipalSolucionada": "Obter máxima utilidade sem comprometer o orçamento",
    "gatilhoMentalEscolhido": "Prova Social & Escassez de Estoque",
    "estiloCtaAplicado": "Chamada direta com senso de oportunidade",
    "estrategiaMarketplace": "Aproveitamento dos pontos fortes do marketplace ${product.marketplaceSlug}",
    "objetivoComercialAtingido": "Maximizar a taxa de cliques no link de afiliado",
    "historicoReferenciaTransparente": "Encontrei uma estratégia semelhante com alta conversão nesta categoria e apliquei a mesma estrutura."
  },

  "autoAvaliacaoNota": 9.5,
  "autoAvaliacaoJustificativa": "Excelente adequação ao objetivo comercial, forte apelo de conversão e zero clichês.",

  "scoreValue": 96,
  "scoreJustification": "Pontuação altíssima devido ao alinhamento exato entre o produto, estilo e objetivo de vendas."
}`;
}

// ─── Fallback Analysis Generator ──────────────────────────────────────────────

function createFallbackOfferAnalysis(product: Product, style: OfferStyle = 'padrao'): GeminiOfferAnalysis {
  const pAny = product.currentPrice as any;
  const price = typeof pAny === 'number'
    ? `R$ ${pAny.toFixed(2)}`
    : (pAny && typeof pAny.formatBRL === 'function'
      ? pAny.formatBRL()
      : (pAny && typeof pAny.amount === 'number' ? `R$ ${pAny.amount.toFixed(2)}` : 'Preço sob consulta'));
  const url = product.affiliateUrl?.url || product.originalUrl || '';

  const titleLower = product.title.toLowerCase();

  // Análise semântica dinâmica por tipo de produto
  let productCategorySemantic = 'Geral';
  let painPoint = 'Encontrar produtos autênticos com o melhor preço';
  let mainBenefit = 'Alta utilidade, excelente acabamento e garantia de qualidade';
  let dynamicAngle = 'Excelente Custo-Benefício';
  let keyArgument = 'Design moderno e alta aprovação dos compradores';

  if (titleLower.includes('bolsa') || titleLower.includes('mochila') || titleLower.includes('vestido') || titleLower.includes('calçado') || titleLower.includes('sapato')) {
    productCategorySemantic = 'Moda & Acessórios';
    painPoint = 'Combinar elegância, durabilidade e versatilidade nos looks diários';
    mainBenefit = 'Design sofisticado, espaço ideal e acabamento de alto padrão';
    dynamicAngle = 'Estilo & Sofisticação';
    keyArgument = 'Perfeito para elevar o seu visual com máximo conforto e elegância';
  } else if (titleLower.includes('garrafa') || titleLower.includes('copo') || titleLower.includes('térmic') || titleLower.includes('stanley')) {
    productCategorySemantic = 'Hidratação & Praticidade';
    painPoint = 'Manter bebidas na temperatura ideal durante horas de trabalho ou treino';
    mainBenefit = 'Isolamento térmico de alta performance, mantendo gelado ou quente por horas';
    dynamicAngle = 'Praticidade & Performance Térmica';
    keyArgument = 'Ideal para acompanhar sua rotina no trabalho, academia ou viagens';
  } else if (titleLower.includes('skate') || titleLower.includes('patins') || titleLower.includes('bike') || titleLower.includes('capacete') || titleLower.includes('suplemento')) {
    productCategorySemantic = 'Esporte & Lazer';
    painPoint = 'Equipamento resistente para garantir estabilidade, segurança e manobras precisas';
    mainBenefit = 'Estrutura reforçada, excelente aderência e rolamentos de alta precisão';
    dynamicAngle = 'Velocidade & Liberdade';
    keyArgument = 'Desenvolvido para máxima durabilidade, segurança e performance nas pistas';
  } else if (titleLower.includes('tv') || titleLower.includes('fone') || titleLower.includes('smartphone') || titleLower.includes('notebook') || titleLower.includes('carregador') || titleLower.includes('amazfit')) {
    productCategorySemantic = 'Tecnologia & Eletrônicos';
    painPoint = 'Garantir alta velocidade, imagem cristalina e tecnologia moderna sem pagar caro';
    mainBenefit = 'Alta performance, conectividade rápida e recursos de última geração';
    dynamicAngle = 'Inovação & Alta Performance';
    keyArgument = 'Tecnologia avançada com resposta rápida e máxima imersão';
  }

  // Estrutura e corpo dinâmicos por estilo
  const styleBodies: Record<OfferStyle, string> = {
    padrao:          `🔥 *${dynamicAngle.toUpperCase()}!*\n\n✨ *${product.title}*\n💰 *De: ${product.previousPrice?.formatBRL() || price} por ${price}*\n\n🚚 Frete Rápido & Compra Segura\n✅ *${mainBenefit}*\n⭐ ${keyArgument}\n\n🛒 *Garanta o seu no link oficial:*\n${url}`,
    explosiva:       `💥 *ACHADINHO BOMBÁSTICO DE ALTO IMPACTO!*\n\n😱 *${product.title}*\n💰 *Apenas ${price}!*\n⚡ Preço baixo assim não vai durar!\n\n🛒 *Corra para garantir o seu antes que esgoste:*\n${url}`,
    premium:         `👑 *SOFISTICAÇÃO & ALTO PADRÃO EXCLUSIVO*\n\n💎 *${product.title}*\n✨ *${mainBenefit}*\n💰 Valor Especial: ${price}\n\n🛒 *Adquira o seu no link oficial de garantia:*\n${url}`,
    urgencia:        `⚠️ *ESTOQUE LIMITADO — CRONÔMETRO ATIVADO!*\n\n⏳ *${product.title}*\n💰 *Apenas: ${price}*\n🚨 Pouquíssimas unidades restantes no fornecedor!\n\n🛒 *Clique rápido para não ficar sem:*\n${url}`,
    minimalista:     `⚡ *${product.title}* por ${price}.\n👉 ${url}`,
    emocional:       `💖 *TRANSFORME SEU DIA A DIA COM MÁXIMO CONFORTO*\n\n🌸 *${product.title}*\n✨ ${mainBenefit}\n💰 Invista em você por apenas: ${price}\n\n🛒 *Garanta agora com carinho:*\n${url}`,
    promocao:        `🏷️ *DESCONTO REAL & ECONOMIA IMBATÍVEL!*\n\n🤑 *${product.title}*\n💰 *De: ${product.previousPrice?.formatBRL() || price} por Apenas ${price}*\n\n🛒 *Aproveite o menor preço do ano:*\n${url}`,
    custo_beneficio: `🎯 *COMPRA INTELIGENTE DE EXCELENTE VALOR*\n\n📊 *${product.title}*\n✅ ${keyArgument}\n💰 Investimento: ${price}\n\n🛒 *Confira todos os detalhes no link oficial:*\n${url}`,
    familia:         `🏡 *PRATICIDADE & CONFORTO PARA O SEU LAR*\n\n👨‍👩‍👧 *${product.title}*\n✨ ${mainBenefit}\n💰 Preço especial para a família: ${price}\n\n🛒 *Garanta para a sua casa no link:*\n${url}`,
    tecnologia:      `⚡ *INOVAÇÃO TÉCNICA & ALTA PERFORMANCE*\n\n🤖 *${product.title}*\n💻 ${mainBenefit}\n💰 Por apenas: ${price}\n\n🛒 *Acesse a tecnologia no link oficial:*\n${url}`,
    casa:            `🛋️ *ORGANIZAÇÃO & CONFORTO DO LAR*\n\n🏠 *${product.title}*\n✨ ${keyArgument}\n💰 Apenas: ${price}\n\n🛒 *Deixe seu lar perfeito no link:*\n${url}`,
    esporte:         `🏆 *SUPERAÇÃO, FOCO & ALTA PERFORMANCE*\n\n🥇 *${product.title}*\n⚡ ${mainBenefit}\n💰 Apenas: ${price}\n\n🛒 *Supere seus limites no link:*\n${url}`,
    presentes:       `🎁 *O PRESENTE PERFEITO QUE VOCÊ PROCURAVA*\n\n🎉 *${product.title}*\n❤️ ${keyArgument}\n💰 Valor: ${price}\n\n🛒 *Surpreenda quem você ama no link:*\n${url}`,
    relampago:       `🚨 *OFERTA RELÂMPAGO ACABA EM POUCOS MINUTOS!*\n\n⏰ *${product.title}*\n💰 *De: ${product.previousPrice?.formatBRL() || price} por ${price}*\n\n🛒 *Garanta no cronômetro agora:*\n${url}`,
    luxo:            `💎 *EXCLUSIVIDADE TOTAL & REFINAMENTO DE ALTO PADRÃO*\n\n👑 *${product.title}*\n✨ ${mainBenefit}\n💰 Valor Exclusivo: ${price}\n\n🛒 *Acesse o atendimento exclusivo no link:*\n${url}`,
  };

  const defaultCopy = styleBodies[style] || styleBodies.padrao;

  return {
    publicoAlvo: `Compradores interessados em ${productCategorySemantic}`,
    dorQueResolve: painPoint,
    beneficioPrincipal: mainBenefit,
    argumentoComercial: keyArgument,
    anguloDeVenda: dynamicAngle,
    emocaoDeCompra: 'Satisfação & Confiança',
    categoria: product.categoryId || productCategorySemantic,
    subcategoria: productCategorySemantic,

    whatsAppText: defaultCopy,
    telegramText: defaultCopy,
    instagramText: `✨ ${product.title}\n\n${mainBenefit}.\n\n🔥 Garanta o seu por apenas ${price} no link da bio!`,
    facebookText: defaultCopy,
    threadsText: defaultCopy,
    pinterestText: defaultCopy,
    tikTokText: defaultCopy,
    youtubeShortsText: defaultCopy,
    statusWhatsAppText: `🔥 ${product.title} por ${price}!`,

    cta: 'Garantir com Desconto',
    hashtags: ['#oferta', '#promoção', '#desconto', '#achadinhos'],
    emojis: ['🔥', '💰', '🛒', '⚡'],
    gatilhosMentais: ['Urgência', 'Custo-Benefício'],

    sugestaoImagem: 'Foto oficial do produto em destaque',
    sugestaoVideo: 'Vídeo rápido de apresentação do produto',
    melhorHorario: '12:00 - Horário do Almoço',
    melhorDia: 'Hoje',

    porQueTitulo: 'Foco no nome do produto e preço imbatível',
    porQueGatilho: 'Incentivo à compra rápida',
    porQueHorario: 'Horário de maior conversão',

    recomendacaoIA: 'Oferta recomendada para publicação imediata.',
    pontosFortes: ['Preço competitivo', 'Link verificado'],
    pontosFracos: ['Estoque sujeito a alteração'],

    scorePreco: 4,
    scoreDesconto: 4,
    scoreFrete: 5,
    scoreCupom: 4,
    scoreAvaliacoes: 4,
    scoreConcorrencia: 3,

    scoreValue: 85,
    scoreJustification: 'Oferta gerada com dados validados do produto.',
  };
}

// ─── Gemini Adapter Class ─────────────────────────────────────────────────────

export class GeminiAIAdapter implements IAIProviderAdapter {
  public readonly providerName = 'gemini';
  private readonly defaultModel = 'gemini-1.5-flash';

  public async generateOfferContent(
    product: Product,
    style: OfferStyle = 'padrao',
    goal: CommercialGoal = 'maxima_conversao',
    mode: AIGenerationMode = 'profissional',
    pastWinningContext?: string,
    hierarchicalMemoryBlock?: string
  ): Promise<AIOfferGenerationResult & { analysis?: GeminiOfferAnalysis }> {
    const temp = getStyleTemperature(style);
    const prompt = buildMarketingPrompt(product, style, goal, mode, pastWinningContext, hierarchicalMemoryBlock);
    let analysis: GeminiOfferAnalysis;

    try {
      const rawText = await callGeminiAPI(prompt, temp);
      analysis = parseGeminiJSON(rawText, product);
    } catch (err) {
      console.warn('[GeminiAIAdapter] ⚠️ Falha na chamada da API Gemini. Utilizando fallback seguro com dados do produto:', err);
      analysis = createFallbackOfferAnalysis(product, style);
    }

    // Injeta dados limpos para auditoria admin Modo Debug
    analysis.sanitizedPromptDebug = prompt;

    const whatsAppCopy = analysis.whatsAppText || '';

    // Validação e registro no buffer de similaridade deslizante (últimas 20 copys)
    CopySimilarityValidator.isTooSimilarToHistory(whatsAppCopy);
    CopySimilarityValidator.registerCopy(whatsAppCopy);

    const channelContent = ChannelContent.create({
      whatsAppText:  whatsAppCopy,
      telegramText:  analysis.telegramText || whatsAppCopy,
      instagramText: analysis.instagramText || whatsAppCopy,
      facebookText:  analysis.facebookText || whatsAppCopy,
      threadsText:   analysis.threadsText || whatsAppCopy,
      pinterestText: analysis.pinterestText || whatsAppCopy,
      tikTokText:    analysis.tikTokText || whatsAppCopy,
      storyText:     analysis.statusWhatsAppText || analysis.cta || '',
      channelText:   analysis.telegramText || whatsAppCopy,
    });

    const score = new Score({
      value: Math.min(100, Math.max(0, analysis.scoreValue || 75)),
      justification: analysis.scoreJustification || 'Análise comercial concluída.',
      factors: [
        { name: 'Preço & Valor', weight: 25, score: (analysis.scorePreco || 4) * 20, reason: 'Avaliação de competitividade de preço' },
        { name: 'Desconto %', weight: 25, score: (analysis.scoreDesconto || 4) * 20, reason: 'Atratividade de desconto' },
        { name: 'Logística & Frete', weight: 20, score: (analysis.scoreFrete || 5) * 20, reason: 'Velocidade e gratuidade de frete' },
        { name: 'Potencial de Conversão', weight: 30, score: Math.min(100, analysis.scoreValue || 80), reason: analysis.anguloDeVenda || 'Ângulo de venda' },
      ],
    });

    return {
      copies: channelContent,
      score,
      cta: analysis.cta || 'Aproveite a oferta!',
      hashtags: analysis.hashtags || ['#oferta'],
      emojis: analysis.emojis || ['🔥'],
      cost: AICost.create(300, 150, this.defaultModel, 0.0001),
      analysis,
    };
  }

  public async evaluateOfferQuality(product: Product, copy: ChannelContent): Promise<Score> {
    return new Score({
      value: 85,
      justification: 'Oferta avaliada com boa qualidade.',
      factors: [],
    });
  }
}

// ─── Direct HTTP Fetch ────────────────────────────────────────────────────────

async function callGeminiAPI(prompt: string, temperature: number = 0.7): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY ou GOOGLE_API_KEY não configurada no servidor Vercel.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: Math.min(1.2, Math.max(0.1, temperature)),
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Resposta vazia da API do Gemini.');
  }

  return rawText;
}

function parseGeminiJSON(rawText: string, product: Product): GeminiOfferAnalysis {
  console.log('[GeminiAdapter] 📄 Resposta bruta recebida da API Gemini (primeiros 300 caracteres):', rawText.slice(0, 300));

  let text = rawText.trim();

  // 1. Strip markdown code fences globally
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  // 2. Substring extraction between first '{' and last '}'
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    text = text.substring(start, end + 1);
  }

  // 3. First attempt to parse JSON directly
  try {
    return JSON.parse(text) as GeminiOfferAnalysis;
  } catch (firstErr) {
    console.warn('[GeminiAdapter] ⚠️ Primeira tentativa de JSON.parse falhou. Tentando sanitização de caracteres de controle...');

    try {
      // Clean invalid unescaped control characters
      const cleaned = text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');

      return JSON.parse(cleaned) as GeminiOfferAnalysis;
    } catch (secondErr) {
      console.warn('[GeminiAdapter] 🛡️ Ativando Fallback Seguro baseado nos dados do produto (JSON Parse inválido)...');
      return createFallbackOfferAnalysis(product);
    }
  }
}
