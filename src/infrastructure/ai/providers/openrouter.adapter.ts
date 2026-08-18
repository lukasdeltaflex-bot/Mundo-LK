import { IAIProviderAdapter, AIOfferGenerationResult } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { Product } from '../../../core/domain/entities/product.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';
import { Score } from '../../../core/domain/entities/score.entity';
import {
  OfferStyle,
  CommercialGoal,
  AIGenerationMode,
  GeminiOfferAnalysis,
  getStyleTemperature,
  buildMarketingPrompt,
} from './gemini.adapter';
import { CopySimilarityValidator } from '@/core/domain/services/CopySimilarityValidator';

// ─── Config ──────────────────────────────────────────────────────────────────

export const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || 'openrouter/auto';

export const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

// ─── Technical error predicate ───────────────────────────────────────────────

/** Returns true only for technical failures — NOT for "bad" content. */
function isTechnicalError(err: unknown): boolean {
  if (err instanceof Error) {
    if (err.name === 'AbortError') return true;
    const msg = err.message.toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('500') ||
      msg.includes('502') ||
      msg.includes('503') ||
      msg.includes('504') ||
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('econnrefused') ||
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('resposta vazia')
    );
  }
  return false;
}

// ─── OpenRouter Adapter ───────────────────────────────────────────────────────

export class OpenRouterAIAdapter implements IAIProviderAdapter {
  public readonly providerName: string = 'openrouter';

  public async generateOfferContent(
    product: Product,
    style: OfferStyle = 'padrao',
    goal: CommercialGoal = 'maxima_conversao',
    mode: AIGenerationMode = 'profissional',
    pastWinningContext?: string,
    hierarchicalMemoryBlock?: string,
    fallbackReason?: string
  ): Promise<AIOfferGenerationResult & { analysis?: GeminiOfferAnalysis }> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error(
        '[OpenRouterAIAdapter] OPENROUTER_API_KEY não configurada no servidor. ' +
        'Adicione a variável de ambiente OPENROUTER_API_KEY (jamais como NEXT_PUBLIC_).'
      );
    }

    // Safe log: only show key prefix, never the full key
    const keyPrefix = apiKey.slice(0, 8) + '…';
    console.log(
      `[OpenRouterAIAdapter] 🔄 Acionando fallback OpenRouter ` +
      `(key: ${keyPrefix}, model: ${OPENROUTER_MODEL}) ` +
      `para produto: "${product.title}"`
    );
    if (fallbackReason) {
      console.log(`[OpenRouterAIAdapter] 📋 Motivo do fallback: ${fallbackReason}`);
    }

    const startTime = Date.now();
    const temperature = getStyleTemperature(style);
    const prompt = buildMarketingPrompt(
      product,
      style,
      goal,
      mode,
      pastWinningContext,
      hierarchicalMemoryBlock
    );

    const timeoutMs = parseInt(process.env.OPENROUTER_TIMEOUT_MS || '25000', 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let rawText: string;
    let modelUsed: string = OPENROUTER_MODEL;

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mundolk.app',
          'X-Title': 'MundoLK - Gerador de Copy de Ofertas',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: Math.min(1.2, Math.max(0.1, temperature)),
          max_tokens: 4096,
          response_format: { type: 'json_object' },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API error HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      rawText = data?.choices?.[0]?.message?.content;
      modelUsed = data?.model || OPENROUTER_MODEL;

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('OpenRouter retornou resposta vazia ou sem conteúdo.');
      }

      const durationMs = Date.now() - startTime;
      console.log(
        `[OpenRouterAIAdapter] ✅ Resposta recebida em ${durationMs}ms ` +
        `via modelo: ${modelUsed}`
      );
    } catch (err) {
      clearTimeout(timeoutId);
      const reason = err instanceof Error ? err.message : String(err);
      console.error(`[OpenRouterAIAdapter] 🚨 Falha na chamada da API OpenRouter: ${reason}`);
      throw new Error(`Falha técnica no provider OpenRouter: ${reason}`);
    }

    // Parse response (reuse same JSON parsing logic)
    const analysis = parseOpenRouterJSON(rawText, product);
    analysis.isFallback = true;
    analysis.providerUsed = `openrouter/${modelUsed}`;
    analysis.fallbackReason = fallbackReason || 'Gemini indisponível — OpenRouter acionado automaticamente';

    const whatsAppCopy = analysis.whatsAppText || '';
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
      justification: analysis.scoreJustification || 'Copy gerada via OpenRouter (fallback).',
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
      cost: AICost.create(300, 150, modelUsed, 0.0),
      analysis,
    };
  }
}

// ─── JSON Parser (mirrors Gemini parser logic) ────────────────────────────────

function parseOpenRouterJSON(rawText: string, product: Product): GeminiOfferAnalysis {
  let text = rawText.trim();
  text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    text = text.substring(start, end + 1);
  }

  try {
    return JSON.parse(text) as GeminiOfferAnalysis;
  } catch {
    // Fallback: try to extract whatsAppText at minimum
    const waMatch = text.match(/"whatsAppText"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
    if (waMatch?.[1]) {
      const wt = waMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      const rawPrice = product.currentPrice.formatBRL();
      return {
        publicoAlvo: 'Compradores buscando praticidade',
        dorQueResolve: 'Solução de necessidade diária',
        beneficioPrincipal: 'Excelente utilidade prática',
        argumentoComercial: `${product.title} em oferta`,
        anguloDeVenda: 'Custo-Benefício',
        emocaoDeCompra: 'Confiança',
        categoria: product.categoryId || 'Geral',
        whatsAppText: wt,
        telegramText: wt,
        instagramText: `✨ ${product.title}\n\n🛒 Confira por ${rawPrice} no link!`,
        facebookText: wt,
        statusWhatsAppText: `🔥 ${product.title} por ${rawPrice}!`,
        cta: 'Confira na loja oficial!',
        hashtags: ['#oferta', '#promoção', '#achadinhos'],
        emojis: ['🔥', '💡', '💰', '🛒'],
        scoreValue: 90,
        scoreJustification: 'Extração resiliente via regex no OpenRouter.',
        isFallback: true,
        providerUsed: 'openrouter-resilient-parser',
      };
    }
    throw new Error(`Falha ao parsear JSON do OpenRouter: ${text.slice(0, 200)}`);
  }
}
