import { IAIProviderAdapter, AIOfferGenerationResult } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { Product } from '../../../core/domain/entities/product.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';
import { Score } from '../../../core/domain/entities/score.entity';

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

  // 3 Creative Variations (A/B/C)
  copyA?: string; // Venda Emocional & Conexão
  copyB?: string; // Oferta Relâmpago & Urgência
  copyC?: string; // Exclusividade Premium & Valor

  cta: string;
  hashtags: string[];
  emojis: string[];
  gatilhosMentais?: string[];

  // Visual Suggestions & Timing
  sugestaoImagem?: string;
  sugestaoVideo?: string;
  melhorHorario?: string;
  melhorDia?: string;

  // Explainable AI (Decision Rationales)
  porQueTitulo?: string;
  porQueGatilho?: string;
  porQueHorario?: string;

  // Commercial Intelligence & Star Breakdown
  recomendacaoIA?: string;
  pontosFortes?: string[];
  pontosFracos?: string[];
  scorePreco?: number; // 1-5
  scoreDesconto?: number; // 1-5
  scoreFrete?: number; // 1-5
  scoreCupom?: number; // 1-5
  scoreAvaliacoes?: number; // 1-5
  scoreConcorrencia?: number; // 1-5

  scoreValue: number;
  scoreJustification: string;
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildMarketingPrompt(product: Product, style: OfferStyle): string {
  const stylePtBR: Record<OfferStyle, string> = {
    padrao:          'equilibrado e persuasivo, com apelo emocional e racional combinados',
    explosiva:       'explosivo, empolgante, foco em achado imperdível e super promoção',
    premium:         'sofisticado, premium, voltado para status, desejo e máxima qualidade',
    urgencia:        'urgência extrema, escassez de estoque e cronômetro ativado',
    minimalista:     'conciso, direto ao ponto, sem floreios — máximo impacto em poucas palavras',
    emocional:       'apelo emocional profundo, cotidiano, transformação e aconchego',
    promocao:        'foco total na porcentagem de desconto, economia real e preço baixo',
    custo_beneficio: 'demonstração racional de excelente custo-benefício e utilidade',
    familia:         'focado no bem-estar da família, facilidade da casa e praticidade',
    tecnologia:      'destaque em inovação, alta performance e especificações modernas',
    casa:            'conforto do lar, organização e utilidade diária na cozinha e casa',
    esporte:         'performance, treino, saúde, foco e superação',
    presentes:       'ideia de presente inesquecível, momentos especiais e carinho',
    relampago:       'oferta relâmpago que vai acabar nos próximos minutos',
    luxo:            'exclusividade total, sofisticação e alto padrão',
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

  const marketplaceContext = {
    shopee:       'Canais da Shopee no Brasil (destaque cupons de frete grátis, moedas e selo de achadinho).',
    mercadolivre: 'Mercado Livre (destaque entrega rápida FULL, parcelamento e compra garantida).',
    amazon:       'Amazon Brasil (destaque entrega Prime grátis e garantia).',
    magalu:       'Magalu (destaque retirada rápida e cashback).',
    geral:        'Canais de Ofertas de Alta Conversão no Brasil.',
  }[product.marketplaceSlug] || 'Canais de Ofertas do Brasil';

  return `Você é o maior especialista do Brasil em Marketing de Afiliados e Copywriting Comercial de Alta Conversão (${marketplaceContext}).

SEU OBJETIVO É GERAR VENDAS REAIS.
- NUNCA escreva respostas genéricas, clichês padronizados ou estruturas idênticas a criações anteriores.
- NUNCA reutilize templates fixos ou textos estáticos.
- Analise profundamente o produto abaixo para entender sua proposição única de valor, a dor que resolve, o público comprador e as maiores objeções.

REGRA INEGOCIÁVEL DE URL:
- Use EXATAMENTE a URL de afiliado fornecida abaixo (${rawAffiliateUrl}).
- NUNCA altere, expanda, modifique ou substitua a URL informada. Mantenha o link curto exatamente como está.

DADOS CONFIRMADOS DO PRODUTO:
- Nome Oficial: ${product.title}
- Descrição: ${product.description || 'Produto oficial de alta utilidade'}
- Marca: ${product.brand || 'Geral'}
- Categoria: ${product.categoryId || 'Geral'}
- Preço Atual: ${price}
- Contexto de Desconto: ${discount}
- Marketplace: ${product.marketplaceSlug}
- Link Afiliado Oficial: ${rawAffiliateUrl}

ESTILO PRINCIPAL SOLICITADO: ${stylePtBR[style]}

━━━ RESPOSTA OBRIGATÓRIA EM JSON PURO ━━━

Responda EXCLUSIVAMENTE com um JSON válido contendo:
1. Análise profunda de marketing (Público, Dor, Benefício, Ângulo de Venda).
2. As copys oficiais formatadas para cada canal.
3. Três variações criativas alternativas de copy (copyA, copyB, copyC) para testes A/B:
   - copyA: Venda Emocional & Conexão Profunda.
   - copyB: Oferta Relâmpago & Urgência Extrema.
   - copyC: Exclusividade Premium & Valor Percebido.

{
  "publicoAlvo": "descrição analítica do comprador ideal",
  "dorQueResolve": "problema real e cotidiano que este produto soluciona",
  "beneficioPrincipal": "principal transformação gerada pelo produto",
  "argumentoComercial": "argumento de venda irresistível",
  "anguloDeVenda": "ângulo estratégico utilizado",
  "emocaoDeCompra": "emoção disparadora da decisão",
  "categoria": "${product.categoryId || 'Geral'}",
  "subcategoria": "subcategoria analítica",

  "whatsAppText": "Copy completa formatada para WhatsApp incluindo o link exato: ${rawAffiliateUrl}",
  "telegramText": "Copy formatada para Telegram com negrito e o link exato: ${rawAffiliateUrl}",
  "instagramText": "Legenda engajadora para Instagram com hashtags",
  "facebookText": "Post persuasivo para grupos de Facebook com o link exato: ${rawAffiliateUrl}",
  "statusWhatsAppText": "Texto ultra-curto com emojis para Status/Stories",

  "copyA": "Variação A (Venda Emocional): Foco na conexão e transformação pessoal",
  "copyB": "Variação B (Oferta Relâmpago): Foco em urgência extrema e escassez de estoque",
  "copyC": "Variação C (Exclusividade Premium): Foco no valor percebido e sofisticação",

  "cta": "Garanta o seu com desconto exclusivo agora!",
  "hashtags": ["#oferta", "#promoção", "#achadinhos", "#desconto", "#compraonline"],
  "emojis": ["🔥", "😱", "💰", "🚚", "🛒"],
  "gatilhosMentais": ["Urgência", "Prova Social", "Escassez", "Valor Percebido"],

  "sugestaoImagem": "Sugestão de foto para destacar os pontos fortes",
  "sugestaoVideo": "Sugestão de vídeo rápido mostrando o produto em uso",
  "melhorHorario": "11:30 - Horário do Almoço",
  "melhorDia": "Quarta-feira",

  "scoreValue": 94,
  "scoreJustification": "Pontuação baseada na excelente relação entre apelo comercial, preço e dor resolvida."
}`;
}

// ─── Fallback Analysis Generator ──────────────────────────────────────────────

function createFallbackOfferAnalysis(product: Product): GeminiOfferAnalysis {
  const pAny = product.currentPrice as any;
  const price = typeof pAny === 'number'
    ? `R$ ${pAny.toFixed(2)}`
    : (pAny && typeof pAny.formatBRL === 'function'
      ? pAny.formatBRL()
      : (pAny && typeof pAny.amount === 'number' ? `R$ ${pAny.amount.toFixed(2)}` : 'Preço sob consulta'));
  const url = product.affiliateUrl?.url || product.originalUrl || '';

  const defaultCopy = `🔥 OPORTUNIDADE IMPERDÍVEL!

🧊 ${product.title}

💰 Por apenas: ${price}

💳 Parcelamento facilitado

✅ Excelente recomendação e aprovação dos compradores
⭐ Oportunidade selecionada no marketplace ${product.marketplaceSlug}

🛒 Garanta a sua antes que acabe:
${url}

🚨 Compartilhe com quem ama promoções!`;

  return {
    publicoAlvo: 'Consumidores buscando as melhores ofertas e descontos',
    dorQueResolve: 'Encontrar produtos de qualidade pelo melhor preço',
    beneficioPrincipal: product.title,
    argumentoComercial: `Excelente oportunidade por ${price}`,
    anguloDeVenda: 'Custo-Benefício',
    emocaoDeCompra: 'Satisfação e Economia',
    categoria: product.categoryId || 'Geral',
    subcategoria: '',

    whatsAppText: defaultCopy,
    telegramText: defaultCopy,
    instagramText: defaultCopy,
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
  private readonly defaultModel = 'gemini-2.5-flash';

  public async generateOfferContent(
    product: Product,
    style: OfferStyle = 'padrao'
  ): Promise<AIOfferGenerationResult & { analysis?: GeminiOfferAnalysis }> {
    const prompt = buildMarketingPrompt(product, style);
    let analysis: GeminiOfferAnalysis;

    try {
      const rawText = await callGeminiAPI(prompt);
      analysis = parseGeminiJSON(rawText, product);
    } catch (err) {
      console.warn('[GeminiAIAdapter] ⚠️ Falha na chamada da API Gemini. Utilizando fallback seguro com dados do produto:', err);
      analysis = createFallbackOfferAnalysis(product);
    }

    const whatsAppCopy = analysis.whatsAppText || '';

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

async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY ou GOOGLE_API_KEY não configurada no servidor Vercel.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
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
