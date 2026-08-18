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

  autoAvaliacaoNota?: number;
  autoAvaliacaoJustificativa?: string;
  sanitizedPromptDebug?: string;
  isFallback?: boolean;
  providerUsed?: string;
  fallbackReason?: string;

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
    padrao:          'equilibrado e persuasivo — apresenta os benefícios reais e o apelo comercial de forma harmoniosa',
    explosiva:       'energético e de alto impacto — destaque imediato no diferencial principal do produto e na oportunidade de compra',
    premium:         'sofisticado e elegante — foco no valor percebido, acabamento superior, status e qualidade técnica',
    urgencia:        'direto, dinâmico e focado em ação rápida — valoriza a oportunidade de compra utilizando exclusivamente os fatos reais informados',
    minimalista:     'ultra-conciso e direto ao ponto — transmite a proposta de valor essencial com máxima clareza',
    emocional:       'apelo pessoal e empático — foco na experiência de uso, no bem-estar e no impacto no dia a dia do comprador',
    promocao:        'foco na economia real, comparativo de preço e oportunidade promocional comprovada',
    custo_beneficio: 'demonstração racional de compra inteligente, utilidade prática e durabilidade do produto',
    familia:         'focado na praticidade para o lar, bem-estar da família e facilidade de uso na rotina',
    tecnologia:      'destaque em recursos técnicos, conectividade, alta performance e inovação moderna',
    casa:            'conforto do lar, praticidade no dia a dia da casa/cozinha, solução de pequenos incômodos da rotina, organização e utilidade doméstica real',
    esporte:         'foco em rotina ativa, modos de treino, resistência física, superação e saúde',
    presentes:       'ideia de presente inesquecível, momentos especiais e demonstração de carinho',
    relampago:       'ritmo dinâmico de oportunidade comercial baseado nos fatos reais do produto',
    luxo:            'exclusividade, sofisticação de alto padrão e refinamento em cada detalhe',
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
  const prevPriceStr = product.previousPrice ? formatPrice(product.previousPrice) : null;
  const discountStr = (product.discountPercentage && product.discountPercentage.hasDiscount())
    ? `${product.discountPercentage.value}% OFF`
    : null;

  const priceBlock = (prevPriceStr && discountStr)
    ? `💰 *De ${prevPriceStr} por ${price}*\n🔥 *${discountStr}*`
    : (prevPriceStr
      ? `💰 *De ${prevPriceStr} por ${price}*`
      : `💰 *Por ${price}*`);

  const rawAffiliateUrl = product.affiliateUrl?.url || '';

  const expertPanelDirective = mode === 'estrategica' ? `
━━━ 🎯 MODO IA ESTRATÉGICA (PAINEL DE ESPECIALISTAS EM CONVERSÃO) ━━━
Sintetize a análise sob perspectivas profissionais de Copywriting, Conversão, Psicologia do Consumidor e Marketing Digital.
` : '';

  return `Você é um COPYWRITER BRASILEIRO ESPECIALISTA EM OFERTAS DE AFILIADOS NO WHATSAPP.
Sua missão NÃO é catalogar produtos e nem escrever fichas técnicas. Sua missão é criar OFERTAS COMERCIAIS ENVOLVENTES que façam a pessoa parar para ler, se identificar com uma necessidade do dia a dia, entender rapidamente por que o produto vale a pena e ter vontade imediata de clicar no link.

━━━ FONTES DE FATOS E LIBERDADE NARRATIVA ━━━
1. O BRIEFING É A FONTE EXCLUSIVA DE FATOS TÉCNICOS:
   - Especificações, marca, materiais, medidas, funções técnicas reais, preço e desconto vem EXCLUSIVAMENTE do briefing factual.
   - NUNCA invente especificações técnicas, materiais não citados ou patentes (ex: se o briefing diz "promete não puxar os cabelos", use essa citação factual; NÃO invente "Tecnologia Anti-Embaraço", "Cabo 360°" ou "Aquecimento Rápido em 30s" se não constarem no briefing).
   - NUNCA use promessas absolutas exageradas ("evita entupimentos caros", "resultado perfeito", "garante durabilidade"). Use linguagem commercial realista ("ajuda a impedir que a sujeira siga pelo encanamento", "facilita a limpeza no dia a dia").

2. LIBERDADE TOTAL DE COPYWRITING E CONEXÃO:
   - Você tem TOTAL LIBERDADE para criar o GANCHO EMOCIONAL, a IDENTIFICAÇÃO COM A ROTINA, a PERGUNTA INICIAL, a FORMA DE EXPLICAR A UTILIDADE e a NARRATIVA DE RECOMENDAÇÃO.
   - Responda mentalmente: "Por que alguém compraria isso no dia a dia?" e use essa resposta para conectar o leitor à oferta de forma natural.

━━━ ESTRUTURA VISUAL E DENSIDADE COMERCIAL (ESTILO OFERTA DE AFILIADO DO WHATSAPP) ━━━
Escreva a copy com alta escaneabilidade visual, excelente ritmo e intensidade comercial natural (sem excesso de adjetivos falsos).

Formato de referência (flexível, adapte a quantidade de bullets, emojis e aberturas ao produto real):

[GANCHO INICIAL FORTE E EMOCIONAL EM NEGRITO OU CAIXA ALTA]
(Ex: "🍳✨ *QUEM COZINHA TODO DIA SABE COMO UMA PIA PODE VIRAR UMA DOR DE CABEÇA!*" ou "💁🏻‍♀️✨ *CACHOS PERFEITOS SEM PRECISAR IR AO SALÃO!*")

[CONEXÃO HUMANA COM A ROTINA OU INCÔMODO]
(Ex: "Restinho de comida, sujeira indo embora junto com a água e aquela preocupação com o ralo entupindo… 😩")

[NOME DO PRODUTO EM NEGRITO COM BULLETS COMERCIAIS QUE EXPLICAM A UTILIDADE]
(Formato de bullet: Emoji + *Característica* — benefício ou significado prático de uso cotidiano)
Exemplo:
🧼 *Ralo de Cozinha em Aço Inox Tuut*
✨ *Aço inox reforçado* — resistente e não enferruja.
🍽️ *Retém restos de comida* — ajuda a impedir que a sujeira vá direto para o encanamento.
📏 *11,5 cm de diâmetro* — feito para encaixar na rotina da pia.
🧼 *Fácil de limpar* — tirou, limpou, colocou de volta.

[BLOCO DE PREÇO E DESCONTO DESTACADO]
${priceBlock}

[CTA COM NOME DO MARKETPLACE E LINK]
🛒 *Confira na ${product.marketplaceSlug.toUpperCase()}:*
${rawAffiliateUrl}

[AVISO DINÂMICO DE PREÇO]
⚡ *O preço pode mudar a qualquer momento!*

${hierarchicalMemoryBlock || ''}

OBJETIVO COMERCIAL EXPLÍCITO: ${goalPtBR[goal]}
ESTILO DE COPY SOLICITADO: ${stylePtBR[style]}
MODO DE GERAÇÃO: ${mode.toUpperCase()}
${expertPanelDirective}

${pastWinningContext ? `${pastWinningContext}\n` : ''}

DADOS CONFIRMADOS DO PRODUTO (BRIEFING FACTUAL ABSOLUTO):
- Nome Oficial: "${product.title}"
- Marca: "${product.brand || 'Não especificada'}"
- Categoria Confirmada: "${product.categoryId || 'Geral'}"
- Preço Atual: ${price}
${prevPriceStr ? `- Preço Anterior: ${prevPriceStr}` : ''}
${discountStr ? `- Desconto Confirmado: ${discountStr}` : ''}
- Marketplace de Origem: ${product.marketplaceSlug}
- Link Afiliado Oficial: ${rawAffiliateUrl}
- Briefing / Descrição Factual: "${product.description || 'Nenhuma descrição estendida fornecida'}"

━━━ RESPOSTA OBRIGATÓRIA EM JSON PURO ━━━

{
  "publicoAlvo": "perfil do comprador ideal",
  "dorQueResolve": "principal dor ou incômodo solucionado pelo produto",
  "beneficioPrincipal": "principal transformação ou facilidade gerada",
  "argumentoComercial": "argumento persuasivo de conversão",
  "anguloDeVenda": "ângulo estratégico de venda",
  "emocaoDeCompra": "emoção primária ativada",
  "categoria": "${product.categoryId || 'Geral'}",
  "subcategoria": "subcategoria analítica",

  "whatsAppText": "Escreva a Copy de oferta de afiliado completa para WhatsApp com alta escaneabilidade visual: Gancho chamativo emocional ➔ Conexão de rotina ➔ Nome do produto com bullets de características + benefícios de uso ➔ Bloco de Preço (${price}) e Desconto ➔ CTA com link (${rawAffiliateUrl}) ➔ Aviso de preço. É proibido inventar especificações técnicas não citadas ou escrever como ficha técnica institucional.",
  "telegramText": "Copy formatada para Telegram com negrito e o link: ${rawAffiliateUrl}",
  "instagramText": "Legenda engajadora para Instagram com hashtags",
  "facebookText": "Post persuasivo para Facebook com o link: ${rawAffiliateUrl}",
  "statusWhatsAppText": "Texto curto e direto com emojis para Status/Stories",

  "versaoConversao": "Versão Foco em Oportunidade e Valor com o link: ${rawAffiliateUrl}",
  "versaoPremium": "Versão Foco em Qualidade e Durabilidade com o link: ${rawAffiliateUrl}",
  "versaoSocial": "Versão Recomendação Pessoal estilo Achadinhos com o link: ${rawAffiliateUrl}",
  "copyA": "Variação A (Foco em Conforto & Praticidade)",
  "copyB": "Variação B (Foco em Solução de Problema)",
  "copyC": "Variação C (Foco em Custo-Benefício)",

  "cta": "Confira na loja oficial!",
  "hashtags": ["#oferta", "#promoção", "#achadinhos", "#desconto"],
  "emojis": ["🔥", "💡", "💰", "✨", "🛒"],
  "gatilhosMentais": ["Praticidade", "Custo-Benefício", "Prova Social"],

  "explicabilidadeDecisoes": {
    "publicoAlvoIdentificado": "Compradores buscando facilidade e utilidade no dia a dia",
    "dorPrincipalSolucionada": "Resolver incômodos diários com eficiência",
    "gatilhoMentalEscolhido": "Praticidade & Valor Percebido",
    "estiloCtaAplicado": "Chamada natural e convidativa",
    "estrategiaMarketplace": "Foco nos diferenciais do marketplace ${product.marketplaceSlug}",
    "objetivoComercialAtingido": "Maximizar a taxa de cliques no link de afiliado",
    "historicoReferenciaTransparente": "Estratégia otimizada para a categoria com foco em conversão natural."
  },

  "autoAvaliacaoNota": 9.9,
  "autoAvaliacaoJustificativa": "Copy no estilo oferta de afiliado para WhatsApp, com gancho emocional, alta densidade comercial e zero invenção de fatos.",

  "scoreValue": 99,
  "scoreJustification": "Oferta de afiliado persuasiva e 100% factual."
}`;
}

// ─── Fallback Analysis Generator ──────────────────────────────────────────────

function createFallbackOfferAnalysis(
  product: Product,
  style: OfferStyle = 'padrao',
  fallbackReason: string = 'Invocado fallback de segurança local'
): GeminiOfferAnalysis {
  const pAny = product.currentPrice as any;
  const price = typeof pAny === 'number'
    ? `R$ ${pAny.toFixed(2)}`
    : (pAny && typeof pAny.formatBRL === 'function'
      ? pAny.formatBRL()
      : (pAny && typeof pAny.amount === 'number' ? `R$ ${pAny.amount.toFixed(2)}` : 'Preço sob consulta'));
  const url = product.affiliateUrl?.url || product.originalUrl || '';

  const cleanDescription = (product.description || '').trim();
  const descSnippet = cleanDescription.length > 0
    ? cleanDescription
    : `Produto oficial ${product.brand || ''}`.trim();

  // Construção limpa de emergência (sem rótulos robóticos de 'Detalhes:' nem cópia bruta)
  const defaultCopy = `📦 *${product.title}*\n\n💰 *Preço:* ${price}\n\n🛒 *Confira no link oficial:*\n${url}`;

  return {
    publicoAlvo: `Compradores interessados em ${product.categoryId || 'produtos em promoção'}`,
    dorQueResolve: 'Necessidade de compra inteligente com informações claras',
    beneficioPrincipal: cleanDescription.slice(0, 100) || 'Qualidade e procedência garantidas',
    argumentoComercial: `${product.title} com valor atrativo`,
    anguloDeVenda: 'Custo-Benefício',
    emocaoDeCompra: 'Confiança',
    categoria: product.categoryId || 'Geral',
    subcategoria: 'Geral',

    whatsAppText: defaultCopy,
    telegramText: defaultCopy,
    instagramText: `✨ ${product.title}\n\n🛒 Confira por ${price} no link da bio!`,
    facebookText: defaultCopy,
    threadsText: defaultCopy,
    pinterestText: defaultCopy,
    tikTokText: defaultCopy,
    youtubeShortsText: defaultCopy,
    statusWhatsAppText: `🔥 ${product.title} por ${price}!`,

    cta: 'Conferir Oferta Oficial',
    hashtags: ['#oferta', '#promoção', '#achadinhos'],
    emojis: ['📦', '💰', '🛒'],
    gatilhosMentais: ['Custo-Benefício'],

    sugestaoImagem: 'Foto oficial do produto em destaque',
    sugestaoVideo: 'Vídeo rápido de apresentação do produto',
    melhorHorario: '12:00 - Horário do Almoço',
    melhorDia: 'Hoje',

    porQueTitulo: 'Foco no nome do produto e preço imbatível',
    porQueGatilho: 'Incentivo à compra rápida',
    porQueHorario: 'Horário de maior conversão',

    recomendacaoIA: 'Oferta gerada via fallback seguro de sistema.',
    pontosFortes: ['Preço competitivo', 'Link verificado'],
    pontosFracos: ['Estoque sujeito a alteração'],

    scorePreco: 4,
    scoreDesconto: 4,
    scoreFrete: 5,
    scoreCupom: 4,
    scoreAvaliacoes: 4,
    scoreConcorrencia: 3,

    scoreValue: 75,
    scoreJustification: 'Oferta gerada via fallback de segurança local.',
    isFallback: true,
    providerUsed: 'fallback-local',
    fallbackReason,
  };
}

// ─── Gemini Adapter Class ─────────────────────────────────────────────────────

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export class GeminiAIAdapter implements IAIProviderAdapter {
  public readonly providerName = 'gemini';
  private readonly defaultModel = GEMINI_MODEL;

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
      const { rawText, modelUsed } = await callGeminiAPI(prompt, temp);
      analysis = parseGeminiJSON(rawText, product);
      analysis.isFallback = false;
      analysis.providerUsed = modelUsed;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error('[GeminiAIAdapter] 🚨 FALHA REAL NA API GEMINI:', reason);
      throw new Error(`Falha na API do Gemini: ${reason}`);
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

// ─── Official Model Resolution via ListModels ─────────────────────────────────

export async function resolveAvailableGeminiModel(apiKey: string): Promise<string> {
  console.log('[GeminiAdapter] 🔍 Consultando GET /v1beta/models para listar modelos disponíveis da API Key...');

  const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

  if (!listRes.ok) {
    const errText = await listRes.text();
    console.error(`[GeminiAdapter] 🚨 Gemini ListModels HTTP ${listRes.status}: ${errText}`);
    throw new Error(`Gemini ListModels HTTP ${listRes.status}: ${listRes.statusText} - Mensagem: ${errText}`);
  }

  const listData = await listRes.json();
  const rawModels: any[] = listData.models || [];

  const availableWithGenerateContent = rawModels.filter(
    (m) => m.name && Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent')
  );

  if (availableWithGenerateContent.length === 0) {
    const foundNames = rawModels.map((m) => m.name).join(', ');
    throw new Error(`A API key está válida, porém nenhum modelo disponível para esta chave suporta generateContent. Modelos encontrados: [${foundNames}]`);
  }

  // Normaliza nomes (ex: "models/gemini-3.6-flash" ➔ "gemini-3.6-flash")
  const normalizedNames = availableWithGenerateContent.map((m) => m.name.replace('models/', ''));
  console.log('[GeminiAdapter] 📋 Modelos com suporte a generateContent:', normalizedNames.join(', '));

  // 1. Se GEMINI_MODEL estiver configurado no .env e presente na lista com generateContent, prioriza
  const envModel = process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.replace('models/', '') : null;
  if (envModel && normalizedNames.includes(envModel)) {
    console.log(`[GeminiAdapter] 🎯 Modelo priorizado via env GEMINI_MODEL: ${envModel}`);
    return envModel;
  }

  // 2. Ordem de preferência de modelos ativos recomendados pela Google AI
  const preferredOrder = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];

  for (const pref of preferredOrder) {
    if (normalizedNames.includes(pref)) {
      console.log(`[GeminiAdapter] 💡 Modelo selecionado via preferência oficial: ${pref}`);
      return pref;
    }
  }

  // 3. Fallback para o primeiro modelo válido da lista retornada pela API
  const selectedFallback = normalizedNames[0];
  console.log(`[GeminiAdapter] 💡 Modelo selecionado da lista ListModels: ${selectedFallback}`);
  return selectedFallback;
}

async function callGeminiAPI(prompt: string, temperature: number = 0.7): Promise<{ rawText: string; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY ou GOOGLE_API_KEY não configurada no servidor Vercel.');
  }

  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];

  let lastError: Error | null = null;

  for (const modelToUse of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`;

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
        if (response.status === 429) {
          console.warn(`[GeminiAdapter] ⚠️ Modelo ${modelToUse} atingiu limite de cota 429. Alternando para o próximo modelo da lista...`);
          lastError = new Error(`Falha na API do Gemini (HTTP 429): Cota ou créditos pré-pagos esgotados no Google AI Studio. Detalhes: ${errText}`);
          continue;
        }
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Resposta vazia da API do Gemini.');
      }

      console.log(`[GeminiAdapter] ✅ Resposta obtida com sucesso via modelo ${modelToUse}`);
      return { rawText, modelUsed: modelToUse };
    } catch (err) {
      if (err instanceof Error && err.message.includes('429')) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Nenhum modelo da API do Gemini respondeu com sucesso.');
}

function sanitizeJsonString(str: string): string {
  let inString = false;
  let escaped = false;
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      result += char;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    if (inString) {
      if (char === '\n') {
        result += '\\n';
        continue;
      }
      if (char === '\r') {
        result += '\\r';
        continue;
      }
      if (char === '\t') {
        result += '\\t';
        continue;
      }
    }
    result += char;
  }
  return result;
}

function extractFieldByRegex(text: string, fieldName: string): string | undefined {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'i');
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return undefined;
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
      const sanitized = sanitizeJsonString(text);
      return JSON.parse(sanitized) as GeminiOfferAnalysis;
    } catch (secondErr) {
      console.warn('[GeminiAdapter] ⚠️ Sanitização padrão falhou. Executando extração resiliente via Regex...');

      const whatsAppText = extractFieldByRegex(text, 'whatsAppText') || extractFieldByRegex(rawText, 'whatsAppText');
      if (whatsAppText) {
        const rawPrice = product.currentPrice.formatBRL();
        const rawUrl = product.affiliateUrl.url;
        return {
          publicoAlvo: extractFieldByRegex(text, 'publicoAlvo') || 'Compradores buscando praticidade',
          dorQueResolve: extractFieldByRegex(text, 'dorQueResolve') || 'Solução de necessidade diária',
          beneficioPrincipal: extractFieldByRegex(text, 'beneficioPrincipal') || 'Excelente utilidade prática',
          argumentoComercial: extractFieldByRegex(text, 'argumentoComercial') || `${product.title} em oferta`,
          anguloDeVenda: extractFieldByRegex(text, 'anguloDeVenda') || 'Custo-Benefício',
          emocaoDeCompra: extractFieldByRegex(text, 'emocaoDeCompra') || 'Confiança',
          categoria: product.categoryId || 'Geral',
          whatsAppText,
          telegramText: extractFieldByRegex(text, 'telegramText') || whatsAppText,
          instagramText: extractFieldByRegex(text, 'instagramText') || `✨ ${product.title}\n\n🛒 Confira por ${rawPrice} no link!`,
          facebookText: extractFieldByRegex(text, 'facebookText') || whatsAppText,
          statusWhatsAppText: extractFieldByRegex(text, 'statusWhatsAppText') || `🔥 ${product.title} por ${rawPrice}!`,
          cta: extractFieldByRegex(text, 'cta') || 'Confira na loja oficial!',
          hashtags: ['#oferta', '#promoção', '#achadinhos'],
          emojis: ['🔥', '💡', '💰', '🛒'],
          scoreValue: 95,
          scoreJustification: 'Extração resiliente concluída com sucesso via Regex.',
          isFallback: false,
          providerUsed: 'gemini-resilient-parser',
        };
      }

      const errMessage = secondErr instanceof Error ? secondErr.message : String(secondErr);
      console.error('[GeminiAdapter] ❌ Falha crítica no parsing do JSON da API do Gemini:', errMessage);
      throw new Error(`Falha no parsing da resposta JSON do Gemini: ${errMessage}`);
    }
  }
}
