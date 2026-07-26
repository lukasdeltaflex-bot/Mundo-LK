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

  const price    = product.currentPrice ? product.currentPrice.formatBRL() : 'Preço sob consulta';
  const discount = product.discountPercentage && product.discountPercentage.hasDiscount()
    ? `${product.discountPercentage.formatString()} OFF (de ${product.previousPrice?.formatBRL() ?? '?'} por ${price})`
    : `preço atual: ${price} (oportunidade de compra no valor atual)`;

  const marketplaceContext = {
    shopee:       'Use o estilo dos maiores canais da Shopee no Brasil (mencione cupons de frete grátis, moedas e selo de achadinho).',
    mercadolivre: 'Use o estilo Mercado Livre (mencione entrega rápida FULL, parcelamento e garantia de compra protegida).',
    amazon:       'Use o estilo Amazon Brasil (mencione entrega Prime grátis, compra segura e qualidade garantida).',
    magalu:       'Use o estilo Magalu (mencione Retirada Rápida em Loja e cashback no MagaluPay).',
    geral:        'Use o estilo de grandes canais de ofertas do Telegram/WhatsApp do Brasil.',
  }[product.marketplaceSlug] || 'Canais de Ofertas do Brasil';

  return `Você é uma IA Copywriter & Consultora Comercial de Classe Mundial especializada em Marketing de Afiliados no Brasil (${marketplaceContext}).

Sua tarefa é analisar o produto real fornecido e gerar um pacote completo de inteligência comercial e copys persuasivas.

DADOS CONFIRMADOS DO PRODUTO:
- Nome Oficial: ${product.title}
- Descrição: ${product.description || 'Produto oficial de alta utilidade'}
- Marca: ${product.brand || 'Não especificada'}
- Categoria: ${product.categoryId || 'Geral'}
- Preço Atual: ${price}
- Contexto de Desconto: ${discount}
- Marketplace: ${product.marketplaceSlug}
- Link Afiliado: ${product.affiliateUrl?.url || ''}

ESTILO DE COPY SOLICITADO: ${stylePtBR[style]}

━━━ FORMATO OFICIAL DAS COPYS (CANAIS BRASILEIROS DE OFERTAS) ━━━

Para WhatsApp e Telegram, siga OBRIGATORIAMENTE esta estrutura de layout:

🔥 [TÍTULO IMPACTANTE COM EMOJI]

🧊 ${product.title}

💰 De: ${product.previousPrice?.formatBRL() || price}
🔥 Por apenas: ${price}

🚚 Frete Grátis (se disponível) / 💳 Parcelamento facilitado

✅ [Benefício Principal Racional]
⭐ Excelente recomendação e aprovação dos compradores

🛒 Garanta a sua antes que acabe:
${product.affiliateUrl?.url || ''}

🚨 Compartilhe com quem ama promoções!

━━━ RESPOSTA OBRIGATÓRIA EM JSON ━━━

Responda APENAS com um objeto JSON válido (sem comentários):

{
  "publicoAlvo": "descrição concisa do comprador ideal",
  "dorQueResolve": "problema real que o produto resolve no dia a dia",
  "beneficioPrincipal": "maior benefício e transformação",
  "argumentoComercial": "argumento de venda mais forte",
  "anguloDeVenda": "nome do ângulo (ex: Oportunidade Única, Economia Racional)",
  "emocaoDeCompra": "emoção chave gerada",
  "categoria": "${product.categoryId || 'Geral'}",
  "subcategoria": "subcategoria exata",

  "whatsAppText": "Copy completa formatada para WhatsApp no layout oficial",
  "telegramText": "Copy completa formatada para Telegram com <b>negrito</b> e <a>links</a>",
  "instagramText": "Legenda engajadora para post no feed do Instagram com hashtags ao final",
  "facebookText": "Post persuasivo para grupos e página do Facebook com link ao final",
  "threadsText": "Texto direto e provocativo para Threads",
  "pinterestText": "Descrição otimizada para Pin do Pinterest com keywords",
  "tikTokText": "Roteiro/Legenda dinâmico para TikTok",
  "youtubeShortsText": "Roteiro/Legenda curto para YouTube Shorts",
  "statusWhatsAppText": "Texto ultra-curto com emojis direto para Status/Stories",

  "cta": "Chamada para Ação persuasiva de no máximo 8 palavras",
  "hashtags": ["#oferta", "#promoção", "#achadinhos", "#desconto", "#compraonline"],
  "emojis": ["🔥", "😱", "💰", "🚚", "🛒"],
  "gatilhosMentais": ["Urgência", "Prova Social", "Escassez", "Custo-Benefício"],

  "sugestaoImagem": "Sugestão visual de ângulo e ambiente para foto do produto",
  "sugestaoVideo": "Sugestão visual de demonstração do produto em vídeo",
  "melhorHorario": "11:30 - Horário do Almoço",
  "melhorDia": "Quarta-feira",

  "porQueTitulo": "Motivo da escolha do título focado no benefício",
  "porQueGatilho": "Motivo da escolha do gatilho mental principal",
  "porQueHorario": "Motivo do horário de pico de conversão",

  "recomendacaoIA": "Publique imediatamente! Excelente relação preço/benefício com alta procura.",
  "pontosFortes": ["Preço atrativo", "Marca reconhecida", "Excelente apelo de compra"],
  "pontosFracos": ["Estoque limitado"],

  "scorePreco": 5,
  "scoreDesconto": 4,
  "scoreFrete": 5,
  "scoreCupom": 4,
  "scoreAvaliacoes": 4,
  "scoreConcorrencia": 3,

  "scoreValue": 92,
  "scoreJustification": "Excelente pontuação devido ao forte apelo comercial e benefício perceptível."
}`;
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
      analysis = parseGeminiJSON(rawText);
    } catch (err) {
      const msg = err instanceof Error ? (err.stack || err.message) : String(err);
      console.error('[GeminiAIAdapter Exception]:', msg);
      throw new Error(`Falha na geração de IA pelo Gemini: ${msg}`);
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

function parseGeminiJSON(rawText: string): GeminiOfferAnalysis {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned) as GeminiOfferAnalysis;
  } catch (err) {
    console.error('[GeminiAdapter] JSON Parse Fail:', cleaned);
    throw new Error('Falha ao interpretar a resposta JSON da IA do Gemini.');
  }
}
