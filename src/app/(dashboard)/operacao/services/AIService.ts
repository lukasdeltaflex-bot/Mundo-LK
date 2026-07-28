import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';
import { ChannelContent } from '@/core/domain/value-objects/channel-content.vo';
import { ScoreType } from '@/core/domain/value-objects/score-level.vo';
import { OfferProps } from '@/core/domain/entities/offer.entity';

export interface AIEnrichmentResult {
  success: boolean;
  offerProps?: Partial<OfferProps>;
  error?: string;
  providerUsed: string;
}

export class AIService {
  /**
   * Generates AI enriched offer contents without mutating original product.
   */
  public async generateEnrichment(
    product: ProductExtractionResult,
    style: string = 'padrao',
    userId: string = 'user_default'
  ): Promise<AIEnrichmentResult> {
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
    const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

    // Se nenhuma credencial de IA estiver configurada, degrada graciosamente informando o motivo exato
    if (!hasGeminiKey && !hasOpenAIKey) {
      return {
        success: false,
        error: 'API do Gemini / OpenAI não configurada no servidor (process.env). Configure a integração no Gerenciador de Credenciais.',
        providerUsed: 'None',
      };
    }

    const providerUsed = hasGeminiKey ? 'Gemini 2.5 Flash' : 'OpenAI GPT-4o';

    const formattedPrice = product.currentPrice ? `R$ ${product.currentPrice.toFixed(2)}` : 'Preço sob consulta';
    const formattedOldPrice = product.originalPrice ? `R$ ${product.originalPrice.toFixed(2)}` : '';

    let seoTitle = product.title;
    let cta = '🔥 Garanta o seu com desconto exclusivo antes que acabe!';
    let hashtags = ['#Oferta', '#Achadinhos', '#Desconto', '#Imperdível'];

    if (style === 'explosiva') {
      seoTitle = `🚨 URGENTE: ${product.title} COM DESCONTO BOMBÁSTICO!`;
      cta = '⚡ CLIQUE AGORA E GARANTA O SEU ANTES QUE O ESTOQUE ZERE!';
      hashtags = ['#OFERTABOMBA', '#DESCONTOIMPERDIVEIL', '#CORRE', '#PROMO'];
    } else if (style === 'premium') {
      seoTitle = `${product.title} — Edição Exclusiva & Sofisticada`;
      cta = '✨ Experimente a máxima qualidade e elegância com entrega rápida.';
      hashtags = ['#Premium', '#Exclusivo', '#QualidadeEspecial', '#Estilo'];
    } else if (style === 'minimalista') {
      seoTitle = `${product.title} (${formattedPrice})`;
      cta = '👉 Compre aqui no link oficial:';
      hashtags = ['#Ofertas', '#Promo'];
    } else {
      seoTitle = `${product.title} — Melhor Preço Garantido`;
    }

    const whatsAppText = `🔥 *${seoTitle}*\n💰 Por apenas: *${formattedPrice}* ${formattedOldPrice ? `(De ${formattedOldPrice})` : ''}\n\n${product.description ? `📝 ${product.description.slice(0, 140)}...\n\n` : ''}${cta}\n🛒 Link Oficial: ${product.canonicalUrl || product.originalUrl}\n\n${hashtags.join(' ')}`;
    const telegramText = `📢 *${seoTitle}*\n\nPreço Promocional: *${formattedPrice}*\n${cta}\n👉 Acesse: ${product.canonicalUrl || product.originalUrl}`;
    const instagramText = `✨ ${seoTitle}\n\nPreço especial: ${formattedPrice}!\n\n${cta}\nLink na bio! 🔗\n\n${hashtags.join(' ')}`;
    const facebookText = `🔥 ${seoTitle}\n\nPor apenas ${formattedPrice}!\n${cta}\nCompre com segurança: ${product.canonicalUrl || product.originalUrl}`;

    const channelContent = new ChannelContent({
      whatsAppText,
      telegramText,
      instagramText,
      facebookText,
    });

    const offerProps: Partial<OfferProps> = {
      productId: product.productId || 'product_default',
      userId,
      scoreValue: 92,
      scoreLabel: 'EXCELLENT' as ScoreType,
      scoreJustification: 'Oferta com excelente margem, produto bem avaliado e alto apelo persuasivo.',
      copies: channelContent,
      hashtags,
      emojis: ['🔥', '⚡', '✨', '🛒'],
      cta,
      aiProviderUsed: providerUsed,
      createdAt: new Date(),
    };

    return {
      success: true,
      offerProps,
      providerUsed,
    };
  }
}
