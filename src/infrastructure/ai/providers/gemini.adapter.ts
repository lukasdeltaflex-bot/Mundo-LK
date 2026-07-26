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
  /** Internal reasoning — shown in preview UI */
  publicoAlvo: string;
  dorQueResolve: string;
  beneficioPrincipal: string;
  argumentoComercial: string;
  anguloDeVenda: string;
  emocaoDeCompra: string;

  /** Generated content */
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
  "publicoAlvo": "descrição precisa de quem compraria esse produto (ex: mães de crianças pequenas, universitários, profissionais que viajam muito...)",
  "dorQueResolve": "problema real que o produto resolve na vida dessa pessoa",
  "beneficioPrincipal": "o maior benefício percebido pelo comprador",
  "argumentoComercial": "o argumento de venda mais forte para esse produto específico",
  "anguloDeVenda": "nome do ângulo escolhido (ex: conveniência, status, economia, transformação, urgência...)",
  "emocaoDeCompra": "emoção principal que leva à compra desse produto",
  "categoria": "categoria correta do produto em português (ex: Casa e Cozinha, Eletrônicos, Moda, Beleza, Esporte, Infantil, Automotivo, etc.)",
  "whatsAppText": "texto completo para WhatsApp com emojis, máximo 300 caracteres, inclui link de afiliado no final usando: ${product.affiliateUrl.url}",
  "telegramText": "texto para Telegram com HTML básico (<b>negrito</b>) e link ao final",
  "instagramText": "legenda para Instagram com emojis e hashtags no final, até 5 hashtags",
  "facebookText": "post para Facebook, mais descritivo, 2-3 parágrafos",
  "channelText": "anúncio para canal/grupo de afiliados, objetivo e direto",
  "storyText": "texto curto para story Instagram/WhatsApp, máximo 80 caracteres + emoji",
  "cta": "chamada para ação principal, máximo 12 palavras",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"],
  "emojis": ["emoji1", "emoji2", "emoji3", "emoji4"],
  "scoreValue": numero de 0 a 100 representando o potencial de venda desta oferta,
  "scoreJustification": "justificativa em 1-2 frases de por que esse score"
}`;
}

// ─── Gemini API caller ────────────────────────────────────────────────────────

async function callGeminiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.startsWith('demo_')) {
    throw new Error('GEMINI_API_KEY não configurada. Adicione a chave no arquivo .env.local');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:     0.85,   // Criatividade alta para cópias únicas
          maxOutputTokens: 2048,
          topP:            0.95,
          topK:            40,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    }
  );

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
}

function parseGeminiJSON(raw: string): GeminiOfferAnalysis {
  // Strip potential markdown code fences
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(clean) as GeminiOfferAnalysis;
  } catch {
    // Try to extract JSON from the middle of the response
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as GeminiOfferAnalysis;
    }
    throw new Error('Resposta da IA não é um JSON válido.');
  }
}

// ─── Fallback (when API key not set) ─────────────────────────────────────────

function buildFallbackAnalysis(product: Product): GeminiOfferAnalysis {
  const title    = product.title;
  const price    = product.currentPrice.formatBRL();
  const discount = product.discountPercentage.hasDiscount()
    ? ` com ${product.discountPercentage.formatString()} de desconto`
    : '';
  const url = product.affiliateUrl.url;

  return {
    publicoAlvo:        'Pessoas que buscam qualidade e praticidade no dia a dia',
    dorQueResolve:      'Necessidade não atendida que esse produto resolve',
    beneficioPrincipal: 'Qualidade e conveniência combinadas',
    argumentoComercial: `${title}${discount} — aproveite enquanto tem!`,
    anguloDeVenda:      'Conveniência',
    emocaoDeCompra:     'Satisfação e praticidade',
    categoria:          product.categoryId || 'Geral',
    whatsAppText:       `🔥 ${title}${discount} por apenas ${price}!\n\n✅ Entrega rápida e garantia\n\n🛒 Compre agora: ${url}`,
    telegramText:       `🔥 <b>${title}</b>${discount}\n\n💰 Por apenas <b>${price}</b>\n\n<a href="${url}">CLIQUE AQUI PARA COMPRAR</a>`,
    instagramText:      `🔥 ${title}${discount} por ${price}!\n\nLink na bio! 🛍️\n\n#oferta #desconto #achadinhos #promoção`,
    facebookText:       `🔥 Oferta incrível! ${title}${discount} por apenas ${price}. Clique no link para garantir o seu: ${url}`,
    channelText:        `📢 OFERTA: ${title}${discount} por ${price}! Link: ${url}`,
    storyText:          `🔥 ${title} por ${price}${discount}!`,
    cta:                'Aproveite essa oferta agora!',
    hashtags:           ['#oferta', '#promoção', '#desconto', '#achadinhos', '#compraonline', '#mundolk'],
    emojis:             ['🔥', '💥', '🛒', '✅'],
    scoreValue:         65,
    scoreJustification: 'Análise básica — configure GEMINI_API_KEY para análise completa com IA.',
  };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * GeminiAIAdapter — Real AI-powered offer generator.
 *
 * Uses the Gemini 2.0 Flash API to analyze each product individually
 * and generate unique, context-aware marketing copy.
 *
 * The AI reasons like a marketing specialist:
 * - Who would buy this?
 * - What pain does it solve?
 * - What emotion drives purchase?
 * - What's the strongest selling argument?
 *
 * Falls back to structured templates if GEMINI_API_KEY is not set.
 */
export class GeminiAIAdapter implements IAIProviderAdapter {
  public readonly providerName: string = 'gemini-2.0-flash';

  public async generateOfferContent(
    product: Product,
    style: OfferStyle = 'padrao'
  ): Promise<AIOfferGenerationResult & { analysis?: GeminiOfferAnalysis }> {
    let analysis: GeminiOfferAnalysis;

    try {
      const prompt  = buildMarketingPrompt(product, style);
      const rawText = await callGeminiAPI(prompt);
      analysis      = parseGeminiJSON(rawText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // Log but don't crash — fall back to structured output
      console.warn('[GeminiAIAdapter] API call failed, using fallback:', msg);
      analysis = buildFallbackAnalysis(product);
    }

    // Build domain value objects from AI response
    const copies = ChannelContent.create({
      whatsAppText:  analysis.whatsAppText,
      telegramText:  analysis.telegramText,
      instagramText: analysis.instagramText,
      facebookText:  analysis.facebookText,
      channelText:   analysis.channelText,
      storyText:     analysis.storyText,
    });

    const score = new Score({
      value:         Math.min(100, Math.max(0, analysis.scoreValue || 70)),
      justification: analysis.scoreJustification || '',
      factors: [
        { name: 'Análise de Produto',  weight: 30, score: 90, reason: 'IA analisou produto individualmente' },
        { name: 'Ângulo de Venda',     weight: 25, score: 90, reason: analysis.anguloDeVenda || '—' },
        { name: 'Desconto',            weight: 25, score: product.discountPercentage.hasDiscount() ? 90 : 55, reason: product.discountPercentage.formatString() },
        { name: 'Qualidade do Copy',   weight: 20, score: 85, reason: 'Gerado por IA com contexto real do produto' },
      ],
    });

    const cost = AICost.create(500, 800, this.providerName, 0.0001);

    return {
      copies,
      hashtags: Array.isArray(analysis.hashtags) ? analysis.hashtags.slice(0, 10) : [],
      emojis:   Array.isArray(analysis.emojis)   ? analysis.emojis.slice(0, 5)    : ['🔥'],
      cta:      analysis.cta || 'Aproveite agora!',
      score,
      cost,
      analysis, // Extra field for rich preview
    };
  }
}
