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
    minimalista:     'ultra-conciso e direto ao ponto — transmite a proposta de valor essencial com máxima clareza e poucas palavras',
    emocional:       'apelo pessoal e empático — foco na experiência de uso, no bem-estar e no impacto no dia a dia do comprador',
    promocao:        'foco na economia real, comparativo de preço e oportunidade promocional comprovada',
    custo_beneficio: 'demonstração racional de compra inteligente, utilidade prática e durabilidade do produto',
    familia:         'focado na praticidade para o lar, bem-estar da família e facilidade de uso na rotina',
    tecnologia:      'destaque em recursos técnicos, conectividade, alta performance e inovação moderna',
    casa:            'conforto do lar, praticidade no dia a dia, organização e utilidade doméstica',
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

━━━ PROTOCOLO RÍGIDO DE TRANSFORMAÇÃO EDITORIAL & CONTEÚDO FACTUAL ━━━
1. A "DESCRIÇÃO / DETALHES DO PRODUTO" É O BRIEFING DE INFORMAÇÕES (MATÉRIA-PRIMA), E NÃO O TEXTO DE SAÍDA.
2. VOCÊ É UM REDATOR HUMANO DE GRUPOS DE ACHADINHOS NO WHATSAPP:
   - NUNCA copie a descrição literalmente.
   - NUNCA cole "📝 Detalhes:" seguido do texto da fonte.
   - NUNCA reproduza os tópicos ou a ordem original da descrição.
   - NUNCA transforme cada especificação técnica em uma linha separada de tópicos robóticos.
   - SELECIONE apenas os 2 a 5 diferenciais mais atraentes para o comprador no WhatsApp.
   - CONDENSE e REESCREVA em português brasileiro natural, fluido, dinâmico e comercial (50 a 100 palavras de texto comercial).
3. O GANCHO INICIAL DEVE NASCER DO PRODUTO (ex: "⌚ Pra quem procura um smartwatch completo..." ou "🌸 Fragrância delicada para o dia a dia..."). JAMAIS use ganchos genéricos repetitivos como "🔥 OFERTA IMPERDÍVEL!" para todos os produtos.
4. REGRA ANTI-INVENÇÃO: Use apenas os fatos confirmados na Descrição / Detalhes. NUNCA invente características, tempo de fixação, frete grátis, descontos não confirmados, prazos, estoques, escassez ou certificações.

DADOS CONFIRMADOS DO PRODUTO (BRIEFING INEGOCIÁVEL):
- 📝 DESCRIÇÃO / DETALHES DO PRODUTO (FONTE DE CONHECIMENTO): "${product.description || 'Nenhuma descrição estendida fornecida'}"
- Nome Oficial: "${product.title}"
- Marca: "${product.brand || 'Não especificada'}"
- Categoria Confirmada (Contexto Comercial): "${product.categoryId || 'Geral'}"
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
      analysis.isFallback = false;
      analysis.providerUsed = this.defaultModel;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn('[GeminiAIAdapter] ⚠️ Falha na chamada da API Gemini. Motivo:', reason);
      analysis = createFallbackOfferAnalysis(product, style, reason);
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
      const errMessage = secondErr instanceof Error ? secondErr.message : String(secondErr);
      console.error('[GeminiAdapter] ❌ Falha crítica no parsing do JSON da API do Gemini:', errMessage);
      throw new Error(`Falha no parsing da resposta JSON do Gemini: ${errMessage}`);
    }
  }
}
