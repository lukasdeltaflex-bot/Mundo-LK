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
    : `preço atual: ${price}`;

  return `Você é uma especialista em marketing digital, copywriting e psicologia do consumidor brasileiro.
Sua tarefa é analisar um produto de afiliado e criar uma oferta ÚNICA e PERSONALIZADA para ele.

PRODUTO PARA ANÁLISE:
Nome: ${product.title}
Descrição: ${product.description || 'Não disponível'}
Marca: ${product.brand || 'Não informada'}
Categoria registrada: ${product.categoryId || 'Não definida'}
Preço: ${discount}
Marketplace: ${product.marketplaceSlug}

━━━ INSTRUÇÕES DE ANÁLISE ━━━

PASSO 1 — ENTENDER O PRODUTO
Analise profundamente o produto acima. Pense:
- O que esse produto FAZ de verdade?
- Qual DOR ou NECESSIDADE ele resolve?
- Quem seria o comprador ideal?
- Por que essa pessoa compraria HOJE?
- Qual é o argumento mais forte para vender esse produto?
- Qual emoção leva à compra (medo de perder, desejo, praticidade, status, economia)?

PASSO 2 — CRIAR A OFERTA
Com base na análise, crie textos ÚNICOS para esse produto.
Estilo da oferta: ${stylePtBR[style]}

NÃO use:
- Frases genéricas como "produto de alta qualidade"
- Estruturas repetitivas como "Produto X com características Y e Z"
- Linguagem de catálogo

USE:
- Linguagem de vendedor consultivo brasileiro
- Apelo ao benefício real, não à característica
- Emojis estratégicos (não excessivos)
- Chamada para ação irresistível
- Tom adequado para WhatsApp, Telegram e Instagram

━━━ RESPOSTA OBRIGATÓRIA EM JSON ━━━

Responda SOMENTE com este JSON válido, sem markdown, sem explicações:

{
  "publicoAlvo": "descrição precisa de quem compraria esse produto",
  "dorQueResolve": "problema real que o produto resolve na vida dessa pessoa",
  "beneficioPrincipal": "o maior benefício percebido pelo comprador",
  "argumentoComercial": "o argumento de venda mais forte para esse produto específico",
  "anguloDeVenda": "nome do ângulo escolhido",
  "emocaoDeCompra": "emoção principal que leva à compra",
  "categoria": "categoria correta do produto em português (ex: Casa e Cozinha, Eletrônicos, Moda, Beleza, Esporte, Infantil, Automotivo, etc.)",
  "whatsAppText": "texto completo para WhatsApp com emojis, máximo 300 caracteres, inclui link: ${product.affiliateUrl.url}",
  "telegramText": "texto para Telegram com HTML básico (<b>negrito</b>) e link ao final",
  "instagramText": "legenda para Instagram com emojis e hashtags no final, até 5 hashtags",
  "facebookText": "post para Facebook, mais descritivo, 2-3 parágrafos",
  "channelText": "anúncio para canal/grupo de afiliados, objetivo e direto",
  "storyText": "texto curto para story Instagram/WhatsApp, máximo 80 caracteres + emoji",
  "cta": "chamada para ação principal, máximo 12 palavras",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "emojis": ["emoji1", "emoji2", "emoji3", "emoji4"],
  "scoreValue": 85,
  "scoreJustification": "justificativa em 1-2 frases"
}`;
}

// ─── Gemini API caller with strict timeout & diagnostic logging ───────────────

async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const envMode = process.env.NODE_ENV || process.env.NEXT_PUBLIC_APP_ENV || 'development';

  // Server-side diagnostic log (never logs key value)
  console.log(`[Gemini Diagnosis] GEMINI_API_KEY encontrada: ${apiKey ? 'SIM' : 'NÃO'}`);
  console.log(`[Gemini Diagnosis] Comprimento da chave: ${apiKey ? apiKey.length : 0}`);
  console.log(`[Gemini Diagnosis] Ambiente: ${envMode}`);

  if (!apiKey || apiKey.startsWith('demo_')) {
    throw new Error('GEMINI_API_KEY não configurada. Adicione a chave no arquivo .env.local');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000); // 8-second strict timeout

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => response.statusText);
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

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
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(clean) as GeminiOfferAnalysis;
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as GeminiOfferAnalysis;
    }
    throw new Error('Resposta da IA não é um JSON válido.');
  }
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
      const msg = err instanceof Error ? err.message : String(err);
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
