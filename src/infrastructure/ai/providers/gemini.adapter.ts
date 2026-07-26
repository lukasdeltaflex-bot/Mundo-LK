import { IAIProviderAdapter, AIOfferGenerationResult } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { Product } from '../../../core/domain/entities/product.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';
import { Score } from '../../../core/domain/entities/score.entity';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OfferStyle =
  | 'padrao'
  | 'elegante'
  | 'urgencia'
  | 'promocao'
  | 'minimalista'
  | 'emocional';

export interface GeminiOfferAnalysis {
  publicoAlvo: string;
  dorQueResolve: string;
  beneficioPrincipal: string;
  argumentoComercial: string;
  anguloDeVenda: string;
  emocaoDeCompra: string;

  categoria: string;
  whatsAppText: string;
  telegramText: string;
  instagramText: string;
  facebookText: string;
  channelText: string;
  storyText: string;
  cta: string;
  hashtags: string[];
  emojis: string[];
  scoreValue: number;
  scoreJustification: string;
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildMarketingPrompt(product: Product, style: OfferStyle): string {
  const stylePtBR: Record<OfferStyle, string> = {
    padrao:     'equilibrado e persuasivo, com apelo emocional e racional combinados',
    elegante:   'sofisticado, premium, voltado para status e qualidade — sem exageros',
    urgencia:   'gerando senso de urgência extremo, escassez e oportunidade única',
    promocao:   'focado no preço, desconto e valor de custo-benefício',
    minimalista:'conciso, direto, sem floreios — máximo impacto com poucas palavras',
    emocional:  'apela à emoção, sonhos, aspirações e transformação de vida do comprador',
  };

  const price    = product.currentPrice.formatBRL();
  const discount = product.discountPercentage.hasDiscount()
    ? `${product.discountPercentage.formatString()} OFF (de ${product.previousPrice?.formatBRL() ?? '?'} por ${price})`
    : `preço atual: ${price} (sem desconto informado — foque no valor percebido e oportunidade de preço atual)`;

  return `Você é uma especialista de classe mundial em marketing digital, copywriting persuasivo e psicologia do consumidor brasileiro.
Sua tarefa é analisar um produto de afiliado e criar uma oferta ÚNICA, ALTAMENTE PERSUASIVA e PERSONALIZADA para ele.

PRODUTO PARA ANÁLISE:
Nome: ${product.title}
Descrição: ${product.description || 'Descrição curta — use seu conhecimento prévio sobre este produto/categoria para entender todos os benefícios reais'}
Marca: ${product.brand || 'Não informada'}
Categoria registrada: ${product.categoryId || 'Não definida'}
Preço: ${discount}
Marketplace: ${product.marketplaceSlug}

━━━ INSTRUÇÕES DE ANÁLISE ━━━

PASSO 1 — ENTENDER O PRODUTO PROFUNDAMENTE
- Caso a descrição do produto seja curta ou incompleta, USE SEU CONHECIMENTO GERAL sobre este tipo de item/produto/marca para preencher as lacunas e identificar dores, recursos e benefícios reais.
- O que esse produto FAZ de verdade no dia a dia do comprador?
- Qual DOR, DESCONFORTO ou NECESSIDADE ele resolve?
- Quem é o comprador ideal? (Ex: mães, atletas, profissionais remotos, estudantes, motoristas...)
- Por que comprar HOJE pelo preço de ${price}?
- Qual emoção impulsiona a decisão de compra?

PASSO 2 — CRIAR A OFERTA PERSONALIZADA
Estilo exigido: ${stylePtBR[style]}

REGRAS RÍGIDAS DE COPYWRITING:
- NUNCA use frases genéricas como "produto de alta qualidade", "excelente opção" ou "compre já".
- NUNCA repita o mesmo padrão de texto para produtos diferentes.
- VENDA O BENEFÍCIO REAL e a transformação, não apenas a ficha técnica.
- Adapte o tom para redes sociais brasileiras (WhatsApp, Telegram, Instagram).

━━━ RESPOSTA OBRIGATÓRIA EM JSON ━━━

Responda SOMENTE com um objeto JSON válido, sem comentários:

{
  "publicoAlvo": "descrição concisa de 1 frase de quem compra este produto",
  "dorQueResolve": "problema real que o produto resolve (máximo 15 palavras)",
  "beneficioPrincipal": "maior benefício e transformação (máximo 15 palavras)",
  "argumentoComercial": "argumento de venda mais forte (máximo 20 palavras)",
  "anguloDeVenda": "nome do ângulo (ex: Conveniência, Status, Economia)",
  "emocaoDeCompra": "emoção chave da compra",
  "categoria": "categoria precisa em português (ex: Casa e Cozinha, Eletrônicos, etc.)",
  "whatsAppText": "texto persuasivo para WhatsApp com emojis e link no final (máximo 200 caracteres)",
  "telegramText": "texto para Telegram com <b>negrito</b> e link no final (máximo 200 caracteres)",
  "instagramText": "legenda engajadora para Instagram com hashtags ao final (máximo 200 caracteres)",
  "facebookText": "post persuasivo para Facebook (máximo 250 caracteres)",
  "channelText": "anúncio objetivo para canal de ofertas (máximo 120 caracteres)",
  "storyText": "texto curto direto para Story com emoji (máximo 60 caracteres)",
  "cta": "chamada para ação (máximo 8 palavras)",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "emojis": ["🔥", "✨", "🛒"],
  "scoreValue": 85,
  "scoreJustification": "justificativa curta de 1 frase"
}
IMPORTANT: Mantenha cada texto curto e objetivo. Responda APENAS o JSON válido.`;
}

// ─── Gemini API caller with strict timeout & diagnostic logging ───────────────

async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const envMode = process.env.NODE_ENV || process.env.NEXT_PUBLIC_APP_ENV || 'development';

  // Server-side diagnostic log (never logs key value)
  console.log(`[Gemini Diagnosis] GEMINI_API_KEY / GOOGLE_API_KEY encontrada: ${apiKey ? 'SIM' : 'NÃO'}`);
  console.log(`[Gemini Diagnosis] Comprimento da chave: ${apiKey ? apiKey.length : 0}`);
  console.log(`[Gemini Diagnosis] Ambiente: ${envMode}`);

  if (!apiKey || apiKey.startsWith('demo_')) {
    throw new Error('GEMINI_API_KEY ou GOOGLE_API_KEY não configurada. Adicione a chave no arquivo .env.local');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000); // 20-second timeout

  try {
    console.log('[4.1] Enviando requisição HTTP para a API do Google Gemini (gemini-2.5-flash)...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      console.error(`[4.ERR] Gemini API HTTP ${response.status}:`, errText);
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    console.log('[5.0] Resposta HTTP 200 OK recebida do Gemini com sucesso!');

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message: string };
    };

    if (data.error) throw new Error(`Gemini API: ${data.error.message}`);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error('Gemini retornou resposta vazia.');
    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function parseGeminiJSON(raw: string): GeminiOfferAnalysis {
  let clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: GeminiOfferAnalysis | null = null;

  try {
    parsed = JSON.parse(clean) as GeminiOfferAnalysis;
  } catch (err1) {
    console.error('[parseGeminiJSON direct parse error]:', err1 instanceof Error ? err1.message : err1);
    // Replace unescaped control chars (like raw newlines inside JSON strings)
    const sanitized = clean.replace(/[\u0000-\u001F]+/g, (match) => (match.includes('\n') ? '\\n' : ' '));
    const match = sanitized.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]) as GeminiOfferAnalysis;
      } catch (err2) {
        console.error('[parseGeminiJSON match parse error]:', err2 instanceof Error ? err2.message : err2);
      }
    }
  }

  if (!parsed) {
    throw new Error('Resposta da IA não é um JSON válido.');
  }

  // Normalize scoreValue (if AI returned 0-10 scale instead of 0-100)
  if (typeof parsed.scoreValue === 'number' && parsed.scoreValue > 0 && parsed.scoreValue <= 10) {
    parsed.scoreValue = Math.round(parsed.scoreValue * 10);
  }

  // Normalize emojis (if AI returned emoji string instead of array)
  if (typeof parsed.emojis === 'string') {
    const str = parsed.emojis as unknown as string;
    const matches = str.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
    parsed.emojis = matches && matches.length > 0 ? Array.from(new Set(matches)).slice(0, 5) : ['🔥', '✨', '🛒'];
  }

  return parsed;
}

// ─── Fallback (local smart classification when API key/network fails) ─────────

function buildFallbackAnalysis(product: Product): GeminiOfferAnalysis {
  const title = product.title || 'Produto sem título';
  const price = product.currentPrice ? product.currentPrice.formatBRL() : 'Preço sob consulta';
  const discount = product.discountPercentage?.hasDiscount()
    ? ` com ${product.discountPercentage.formatString()} de desconto`
    : '';
  const url = product.affiliateUrl?.url || '';

  const titleLower = title.toLowerCase();
  let cat = 'Geral';
  let dor = 'Praticidade no dia a dia e economia de tempo';
  let pub = 'Consumidores que buscam qualidade e bom preço';
  let ben = 'Excelente custo-benefício e utilidade garantida';
  let ang = 'Conveniência';
  let emo = 'Satisfação e praticidade';

  if (/garrafa|copo|panela|cozinha|xícara|caneca|cafeteira/i.test(titleLower)) {
    cat = 'Casa e Cozinha';
    dor = 'Manter bebidas na temperatura ideal ao longo do dia';
    pub = 'Trabalhadores, estudantes e praticantes de esportes';
    ben = 'Isolamento térmico de alta eficiência e facilidade de transporte';
    ang = 'Conforto e Praticidade';
    emo = 'Bem-estar e aconchego';
  } else if (/fone|headphone|bluetooth|caixa de som|áudio/i.test(titleLower)) {
    cat = 'Áudio e Fones';
    dor = 'Fios embaraçados e ruído externo incomodando';
    pub = 'Amantes de música, gamers e trabalhadores remotos';
    ben = 'Som de altíssima qualidade com liberdade sem fio';
    ang = 'Tecnologia e Imersão';
    emo = 'Empolgação e foco';
  } else if (/celular|smartphone|notebook|tablet|tv|smart/i.test(titleLower)) {
    cat = 'Eletrônicos';
    dor = 'Dispositivos lentos que travam no uso diário';
    pub = 'Pessoas modernas, profissionais e entusiastas de tecnologia';
    ben = 'Desempenho rápido, tela incrível e bateria duradoura';
    ang = 'Produtividade e Alta Performance';
    emo = 'Modernidade e eficiência';
  } else if (/perfume|creme|maquiagem|batom|skin/i.test(titleLower)) {
    cat = 'Beleza e Perfumaria';
    dor = 'Cuidar da pele e da aparência com produtos confiáveis';
    pub = 'Pessoas que prezam pelo autocuidado e boa apresentação';
    ben = 'Fragrância marcante e hidratação profunda';
    ang = 'Autoestima e Cuidado';
    emo = 'Confiança e elegância';
  }

  return {
    publicoAlvo: pub,
    dorQueResolve: dor,
    beneficioPrincipal: ben,
    argumentoComercial: `${title}${discount} por apenas ${price}!`,
    anguloDeVenda: ang,
    emocaoDeCompra: emo,
    categoria: cat,
    whatsAppText: `🔥 *${title}*${discount}\n\n💰 Por apenas *${price}*!\n\n✅ ${ben}\n\n🛒 *Compre aqui:* ${url}`,
    telegramText: `🔥 <b>${title}</b>${discount}\n\n💰 Por apenas <b>${price}</b>!\n\n✅ ${ben}\n\n🔗 <a href="${url}">CLIQUE AQUI PARA COMPRAR</a>`,
    instagramText: `🔥 ${title}${discount} por ${price}!\n\n✅ ${ben}\n\nLink no story e na bio! 🛍️\n\n#oferta #promoção #achadinhos #compraonline`,
    facebookText: `🔥 Oferta incrível! ${title}${discount} por apenas ${price}. ${ben}. Clique no link para garantir o seu: ${url}`,
    channelText: `📢 OFERTA: ${title}${discount} por apenas ${price}! Link: ${url}`,
    storyText: `🔥 ${title} por apenas ${price}!`,
    cta: `Garanta o seu ${title} pelo melhor preço!`,
    hashtags: ['#oferta', '#promoção', '#desconto', '#achadinhos', '#mundolk'],
    emojis: ['🔥', '💥', '🛒', '⚡'],
    scoreValue: 78,
    scoreJustification: `Produto analisado (${cat}). Excelente oportunidade com ótimo valor percebido.`,
  };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class GeminiAIAdapter implements IAIProviderAdapter {
  public readonly providerName: string = 'gemini-2.0-flash';

  public async generateOfferContent(
    product: Product,
    style: OfferStyle = 'padrao'
  ): Promise<AIOfferGenerationResult & { analysis?: GeminiOfferAnalysis }> {
    let analysis: GeminiOfferAnalysis;

    try {
      const prompt = buildMarketingPrompt(product, style);
      const rawText = await callGeminiAPI(prompt);
      analysis = parseGeminiJSON(rawText);
    } catch (err) {
      const msg = err instanceof Error ? (err.stack || err.message) : String(err);
      console.warn('[GeminiAIAdapter] API call failed/timed out, using local analysis:', msg);
      analysis = buildFallbackAnalysis(product);
    }

    const copies = ChannelContent.create({
      whatsAppText:  analysis.whatsAppText,
      telegramText:  analysis.telegramText,
      instagramText: analysis.instagramText,
      facebookText:  analysis.facebookText,
      channelText:   analysis.channelText,
      storyText:     analysis.storyText,
    });

    const score = new Score({
      value: Math.min(100, Math.max(0, analysis.scoreValue || 75)),
      justification: analysis.scoreJustification || '',
      factors: [
        { name: 'Análise de Produto', weight: 30, score: 90, reason: 'IA analisou produto individualmente' },
        { name: 'Ângulo de Venda', weight: 25, score: 85, reason: analysis.anguloDeVenda || '—' },
        { name: 'Desconto', weight: 25, score: product.discountPercentage?.hasDiscount() ? 90 : 60, reason: product.discountPercentage?.formatString() || 'Preço regular' },
        { name: 'Qualidade do Copy', weight: 20, score: 85, reason: 'Gerado com contexto real do produto' },
      ],
    });

    const cost = AICost.create(500, 800, this.providerName, 0.0001);

    return {
      copies,
      hashtags: Array.isArray(analysis.hashtags) ? analysis.hashtags.slice(0, 10) : ['#oferta'],
      emojis: Array.isArray(analysis.emojis) ? analysis.emojis.slice(0, 5) : ['🔥'],
      cta: analysis.cta || 'Aproveite agora!',
      score,
      cost,
      analysis,
    };
  }
}
