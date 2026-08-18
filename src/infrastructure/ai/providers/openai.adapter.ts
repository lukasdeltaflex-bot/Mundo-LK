import { IAIProviderAdapter, AIOfferGenerationResult } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { Product } from '../../../core/domain/entities/product.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';
import { Score } from '../../../core/domain/entities/score.entity';
import { OfferStyle, CommercialGoal, AIGenerationMode, GeminiOfferAnalysis } from './gemini.adapter';
import { CopySimilarityValidator } from '@/core/domain/services/CopySimilarityValidator';

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export class OpenAIAdapter implements IAIProviderAdapter {
  public readonly providerName: string = OPENAI_MODEL;

  public async generateOfferContent(
    product: Product,
    style: OfferStyle = 'padrao',
    goal: CommercialGoal = 'maxima_conversao',
    mode: AIGenerationMode = 'profissional',
    pastWinningContext?: string,
    hierarchicalMemoryBlock?: string
  ): Promise<AIOfferGenerationResult & { analysis?: GeminiOfferAnalysis }> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('[OpenAIAdapter] 🚨 OPENAI_API_KEY não configurada no servidor Vercel.');
      throw new Error('A chave OPENAI_API_KEY não está configurada no servidor Vercel. Por favor, adicione a variável de ambiente OPENAI_API_KEY.');
    }

    const prompt = this.buildOpenAIPrompt(product, style, goal, mode, pastWinningContext, hierarchicalMemoryBlock);

    try {
      console.log(`[OpenAIAdapter] 📡 Chamando OpenAI API (${OPENAI_MODEL}) para ${product.title}...`);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em redação publicitária e copywriter profissional para grupos de ofertas e achadinhos no WhatsApp no Brasil. Responda estritamente em JSON estruturado VÁLIDO.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[OpenAIAdapter] 🚨 OpenAI API error ${response.status}:`, errText);
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Falha de Autenticação na API da OpenAI (HTTP ${response.status}): Sua chave OPENAI_API_KEY é inválida ou expirou.`);
        }
        if (response.status === 429) {
          throw new Error(`Falha na API da OpenAI (HTTP 429): Limite de cota ou créditos esgotados na conta da OpenAI. Verifique o faturamento em https://platform.openai.com/account/billing.`);
        }
        throw new Error(`OpenAI API HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content;

      if (!rawText) {
        throw new Error('Resposta vazia recebida da API da OpenAI.');
      }

      const analysis: GeminiOfferAnalysis = JSON.parse(rawText);
      analysis.isFallback = false;
      analysis.providerUsed = OPENAI_MODEL;
      analysis.sanitizedPromptDebug = prompt;

      return this.buildResultFromAnalysis(product, analysis);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error('[OpenAIAdapter] 🚨 Falha real na chamada da OpenAI:', reason);
      throw new Error(`Falha na IA da OpenAI: ${reason}`);
    }
  }

  private buildOpenAIPrompt(
    product: Product,
    style: OfferStyle,
    goal: CommercialGoal,
    mode: AIGenerationMode,
    pastWinningContext?: string,
    hierarchicalMemoryBlock?: string
  ): string {
    const rawPrice = product.currentPrice.formatBRL();
    const rawDiscount = product.discountPercentage.hasDiscount() ? product.discountPercentage.formatString() : '';
    const rawAffiliateUrl = product.affiliateUrl.url;

    return `Você é um ESPECIALISTA BRASILEIRO EM COPYWRITING PERSUASIVO, MARKETING DE AFILIADOS E VENDAS DIGITAIS.
Seu objetivo é escrever textos de vendas altamente persuasivos, humanos, envolventes e específicos para o produto.

━━━ DIRETRIZES DE COPYWRITING E NARRATIVA ━━━
1. O PRODUTO É O PROTAGONISTA:
   - A copy deve nascer da essência e do contexto de uso real do produto.
   - Para Casa e Cozinha: explore dores do lar, rotina doméstica, facilidade de limpeza, organização e pequenos incômodos do dia a dia.
   - Para Eletrônicos/Smartwatches: explore facilidade, recursos práticos e utilidade no pulso/dia a dia.
   - Para Perfumaria/Moda: explore caimento, fragrância, presença e estética.

2. PROTOCOLO DE CONVERSÃO: CARACTERÍSTICA ➔ SIGNIFICADO PRÁTICO ➔ BENEFÍCIO:
   - NUNCA simplesmente liste especificações frias em tópicos robóticos.
   - Sempre que citar uma característica, conecte-a ao significado prático para o comprador.

3. VARIABILIDADE E ESTILO ANTI-TEMPLATE:
   - NUNCA use introduções batidas ou fórmulas engessadas ("✨ Você precisa...", "🚨 Olha esse achadinho...", "🔥 Imperdível...").
   - Varie o tom, os ganchos de abertura, os emojis e o estilo de recomendação de acordo com o produto.

4. REGRA ANTI-INVENÇÃO E PREÇO NATURAL:
   - NUNCA invente funcionalidades, certificações, garantias, frete grátis, descontos fictícios ou escassez artificial.
   - Integre o preço de forma orgânica na narrativa (${rawPrice}).

DADOS CONFIRMADOS DO PRODUTO:
- Nome Oficial: "${product.title}"
- Marca: "${product.brand || 'Desconhecida'}"
- Categoria Comercial: "${product.categoryId || 'Geral'}"
- Preço Oficial: ${rawPrice} ${rawDiscount ? `(Desconto: ${rawDiscount})` : ''}
- Marketplace: ${product.marketplaceSlug}
- Link Afiliado: ${rawAffiliateUrl}
- Briefing / Descrição Factual: "${product.description || 'Nenhuma descrição estendida fornecida'}"

ESTILO SOLICITADO: ${style.toUpperCase()}
OBJETIVO COMERCIAL: ${goal.toUpperCase()}

Retorne um JSON estritamente válido com a seguinte estrutura:
{
  "publicoAlvo": "perfil ideal do comprador",
  "dorQueResolve": "principal dor solucionada",
  "beneficioPrincipal": "benefício chave do produto",
  "argumentoComercial": "argumento forte de conversão",
  "anguloDeVenda": "ângulo de venda utilizado",
  "emocaoDeCompra": "emoção primária ativada",
  "categoria": "${product.categoryId || 'Geral'}",
  "whatsAppText": "Copy persuasiva completa para WhatsApp com gancho contextual, características convertidas em benefícios práticos de uso, preço (${rawPrice}) e link (${rawAffiliateUrl})",
  "telegramText": "Copy formatada para Telegram",
  "instagramText": "Legenda com hashtags para Instagram",
  "facebookText": "Post persuasivo para Facebook",
  "statusWhatsAppText": "Texto curto para Status/Stories",
  "cta": "Chamada para ação clara",
  "hashtags": ["#oferta", "#achadinhos", "#promoção"],
  "emojis": ["📦", "💰", "🛒"],
  "scoreValue": 88,
  "scoreJustification": "Análise comercial concluída via OpenAI."
}`;
  }

  private createFallbackAnalysis(product: Product, style: OfferStyle, reason: string): GeminiOfferAnalysis {
    const rawPrice = product.currentPrice.formatBRL();
    const rawUrl = product.affiliateUrl.url;
    const defaultCopy = `📦 *${product.title}*\n\n💰 *Preço:* ${rawPrice}\n\n🛒 *Confira no link oficial:*\n${rawUrl}`;

    return {
      publicoAlvo: 'Consumidores em geral',
      dorQueResolve: 'Compra rápida com informações validadas',
      beneficioPrincipal: 'Qualidade e procedência',
      argumentoComercial: `${product.title} em oferta`,
      anguloDeVenda: 'Custo-Benefício',
      emocaoDeCompra: 'Confiança',
      categoria: product.categoryId || 'Geral',
      whatsAppText: defaultCopy,
      telegramText: defaultCopy,
      instagramText: `✨ ${product.title}\n\n🛒 Confira por ${rawPrice} no link da bio!`,
      facebookText: defaultCopy,
      statusWhatsAppText: `🔥 ${product.title} por ${rawPrice}!`,
      cta: 'Conferir Oferta Oficial',
      hashtags: ['#oferta', '#promoção'],
      emojis: ['📦', '💰', '🛒'],
      scoreValue: 75,
      scoreJustification: 'Fallback de segurança por indisponibilidade da API OpenAI.',
      isFallback: true,
      providerUsed: 'fallback-local',
      fallbackReason: reason,
    };
  }

  private buildResultFromAnalysis(product: Product, analysis: GeminiOfferAnalysis): AIOfferGenerationResult & { analysis?: GeminiOfferAnalysis } {
    const whatsAppCopy = analysis.whatsAppText || '';

    CopySimilarityValidator.isTooSimilarToHistory(whatsAppCopy);
    CopySimilarityValidator.registerCopy(whatsAppCopy);

    const channelContent = ChannelContent.create({
      whatsAppText: whatsAppCopy,
      telegramText: analysis.telegramText || whatsAppCopy,
      instagramText: analysis.instagramText || whatsAppCopy,
      facebookText: analysis.facebookText || whatsAppCopy,
      threadsText: analysis.threadsText || whatsAppCopy,
      pinterestText: analysis.pinterestText || whatsAppCopy,
      tikTokText: analysis.tikTokText || whatsAppCopy,
      storyText: analysis.statusWhatsAppText || analysis.cta || '',
      channelText: analysis.telegramText || whatsAppCopy,
    });

    const score = new Score({
      value: Math.min(100, Math.max(0, analysis.scoreValue || 85)),
      justification: analysis.scoreJustification || 'Análise OpenAI concluída.',
      factors: [
        { name: 'Preço & Valor', weight: 25, score: 85, reason: 'Avaliação de competitividade de preço' },
        { name: 'Desconto %', weight: 25, score: 85, reason: 'Atratividade de desconto' },
        { name: 'Potencial de Conversão', weight: 50, score: Math.min(100, analysis.scoreValue || 85), reason: analysis.anguloDeVenda || 'Ângulo de venda' },
      ],
    });

    const cost = AICost.create(500, 400, OPENAI_MODEL, 0.0004);

    return {
      copies: channelContent,
      hashtags: analysis.hashtags || ['#oferta', '#achadinhos'],
      emojis: analysis.emojis || ['📦', '💰', '🛒'],
      cta: analysis.cta || 'Garanta a sua oferta agora!',
      score,
      cost,
      analysis,
    };
  }
}
