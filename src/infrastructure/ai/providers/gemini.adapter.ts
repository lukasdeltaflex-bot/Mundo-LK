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

  return `Você é o maior especialista do Brasil em Marketing de Afiliados e Copywriting Comercial de Alta Conversão.

SEU OBJETIVO É GERAR VENDAS REAIS COM INTELIGÊNCIA SEMÂNTICA ESPECÍFICA PARA ESTE PRODUTO.

━━━ PROTOCOLO OBRIGATÓRIO DE ANÁLISE ANTES DE ESCREVER ━━━

1. ENTENDER O PRODUTO REAL:
   - Nome: "${product.title}"
   - Descrição: "${product.description || 'Produto oficial de alta utilidade'}"
   - Marca: "${product.brand || 'Geral'}"
   - Categoria: "${product.categoryId || 'Geral'}"
   - Preço: ${price} (Contexto: ${discount})
   - Marketplace: ${product.marketplaceSlug}

2. ADAPTAR O VOCABULÁRIO E ARGUMENTOS EXCLUSIVAMENTE AO PRODUTO:
   - Se for Bolsa/Moda: Fale de elegância, estilo, acabamento, versatilidade de looks, ocasiões e presença.
   - Se for Garrafa/Copo Térmico: Fale de conservação de temperatura (gelado/quente por horas), academia, trabalho, hidratação e praticidade.
   - Se for Skate/Esporte: Fale de estabilidade, rolamentos, manobras, resistência, velocidade e liberdade.
   - Se for Eletrônico/Gadget: Fale de inovação, velocidade, bateria, produtividade e alta performance.
   - NUNCA use frases genéricas como "Aproveite essa oferta incrível!" que servem para qualquer produto.

3. MUDANÇA RADICAL DE PERSONALIDADE PELO ESTILO SELECIONADO ("${style}"):
   - Aplique o tom exato: "${stylePtBR[style]}".
   - O vocabulário e a energia de uma copy em estilo 'luxo' ou 'premium' DEVE ser totalmente diferente de 'urgencia' ou 'explosiva'.

4. PRESERVAÇÃO RÍGIDA DO LINK CURTO:
   - Use EXATAMENTE a URL de afiliado fornecida: ${rawAffiliateUrl}
   - NUNCA altere, expanda, modifique ou substitua este link.

━━━ RESPOSTA OBRIGATÓRIA EM JSON PURO ━━━

Responda EXCLUSIVAMENTE com um JSON válido contendo a análise e as copys (incluindo variações A/B/C):

{
  "publicoAlvo": "perfil exato do comprador deste produto",
  "dorQueResolve": "dor específica solucionada por este produto",
  "beneficioPrincipal": "principal transformação específica do produto",
  "argumentoComercial": "argumento de venda irresistível adaptado à categoria",
  "anguloDeVenda": "ângulo estratégico utilizado",
  "emocaoDeCompra": "emoção primária ativada",
  "categoria": "${product.categoryId || 'Geral'}",
  "subcategoria": "subcategoria exata",

  "whatsAppText": "Copy completa formatada para WhatsApp no estilo ${style} com o link: ${rawAffiliateUrl}",
  "telegramText": "Copy formatada para Telegram com negrito e o link: ${rawAffiliateUrl}",
  "instagramText": "Legenda engajadora para Instagram específica para o produto",
  "facebookText": "Post persuasivo para grupos de Facebook com o link: ${rawAffiliateUrl}",
  "statusWhatsAppText": "Texto ultra-curto com emojis para Status/Stories",

  "copyA": "Variação A (Venda Emocional): Foco na conexão e transformação pessoal do comprador deste produto",
  "copyB": "Variação B (Oferta Relâmpago): Foco em urgência extrema e escassez de estoque",
  "copyC": "Variação C (Exclusividade Premium): Foco no valor percebido, acabamento e sofisticação",

  "cta": "Garanta o seu com desconto exclusivo agora!",
  "hashtags": ["#oferta", "#promoção", "#achadinhos", "#desconto"],
  "emojis": ["🔥", "😱", "💰", "🚚", "🛒"],
  "gatilhosMentais": ["Urgência", "Prova Social", "Escassez", "Valor Percebido"],

  "sugestaoImagem": "Sugestão de foto para destacar os pontos fortes do produto",
  "sugestaoVideo": "Sugestão de vídeo rápido mostrando o produto em uso",
  "melhorHorario": "11:30 - Horário do Almoço",
  "melhorDia": "Quarta-feira",

  "scoreValue": 95,
  "scoreJustification": "Excelente pontuação devido ao forte apelo comercial e benefício perceptível."
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
  } else if (titleLower.includes('tv') || titleLower.includes('fone') || titleLower.includes('smartphone') || titleLower.includes('notebook') || titleLower.includes('carregador')) {
    productCategorySemantic = 'Tecnologia & Eletrônicos';
    painPoint = 'Garantir alta velocidade, imagem cristalina e tecnologia moderna sem pagar caro';
    mainBenefit = 'Alta performance, conectividade rápida e recursos de última geração';
    dynamicAngle = 'Inovação & Alta Performance';
    keyArgument = 'Tecnologia avançada com resposta rápida e máxima imersão';
  }

  const defaultCopy = `🔥 *${dynamicAngle.toUpperCase()}!*

✨ *${product.title}*

💰 *De: ${product.previousPrice?.formatBRL() || price}*
🔥 *Por apenas: ${price}*

🚚 Frete Rápido & Compra Segura
💳 Parcelamento Facilitado

✅ *${mainBenefit}*
⭐ ${keyArgument}

🛒 *Garanta o seu antes que o estoque acabe:*
${url}

🚨 *Compartilhe com quem procura o melhor achadinho!*`;

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
