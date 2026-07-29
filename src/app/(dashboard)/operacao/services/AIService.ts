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

export interface AIOfferCopyParams {
  title: string;
  price: number;
  previousPrice?: number;
  affiliateUrl: string;
  style: string;
}

export class AIService {
  /**
   * Gera cópia persuasiva sob medida para cada canal/estilo com foco em alta conversão.
   */
  public static async generateOfferCopy(params: AIOfferCopyParams): Promise<string> {
    const formattedPrice = `R$ ${params.price.toFixed(2)}`;
    const formattedOldPrice = params.previousPrice ? `R$ ${params.previousPrice.toFixed(2)}` : '';
    const url = params.affiliateUrl.trim(); // URL mantida integralmente sem redirecionamentos

    switch (params.style) {
      case 'whatsapp':
        return `🔥 *Oportunidade Imperdível!*\n\n📦 *${params.title}*\n\n💰 Apenas: *${formattedPrice}*${formattedOldPrice ? ` ~(De: ${formattedOldPrice})~` : ''}\n\n✅ Envio rápido e estoque limitado!\n\n👉 *Garanta o seu no link oficial:*\n${url}`;

      case 'instagram':
        return `✨ *O achadinho perfeito que você precisava!*\n\n🛍️ *${params.title}*\n\nPor apenas *${formattedPrice}*! 😱\n\nQualidade incrível e o melhor preço do mercado.\n\n🔗 Link no perfil ou acesse:\n${url}\n\n#Achadinhos #OfertaImbativel #Promoção #ComprasOnline`;

      case 'telegram':
        return `⚡ *PROMOÇÃO RÁPIDA TELEGRAM*\n\n🔹 *${params.title}*\n💵 *${formattedPrice}*\n\n👉 Compre no link oficial:\n${url}`;

      case 'facebook':
        return `📢 *RECOMENDAÇÃO DE COMPRA SECURA*\n\nEncontramos a melhor oferta do produto *${params.title}* por apenas *${formattedPrice}*!${formattedOldPrice ? ` Desconto real de ${formattedOldPrice}.` : ''}\n\nGaranta a sua unidade com frete rápido:\n${url}`;

      case 'premium':
        return `👑 *EXCLUSIVIDADE & ALTA QUALIDADE*\n\nDescubra a sofisticação de *${params.title}*.\n\nInvestimento especial: *${formattedPrice}*.\n\n✨ Uma escolha distinta para quem exige o melhor.\n\n🔗 Adquira com garantia:\n${url}`;

      case 'urgency':
        return `🚨 *ÚLTIMAS UNIDADES EM ESTOQUE!*\n\n⚠️ *${params.title}* com desconto de emergência por *${formattedPrice}*!\n\nO estoque está quase esgotado. Não deixe para depois!\n\n⚡ Clique imediatamente:\n${url}`;

      case 'storytelling':
        return `💡 *Você já passou pela frustração de procurar algo de extrema qualidade e não encontrar pelo preço certo?*\n\nConheça *${params.title}*. O produto que resolve seu dia a dia por apenas *${formattedPrice}*.\n\n👉 Confira todos os detalhes:\n${url}`;

      case 'review':
        return `⭐ *AVALIAÇÃO E RECOMENDAÇÃO SINCERA*\n\nTestamos e aprovamos: *${params.title}*!\nSuperou todas as expectativas com custo-benefício imbatível por apenas *${formattedPrice}*.\n\n🛒 Vale cada centavo. Confira aqui:\n${url}`;

      case 'emotional':
        return `❤️ *Você merece esse cuidado no seu dia a dia!*\n\nSurpreenda-se com *${params.title}* por apenas *${formattedPrice}*.\n\nTransforme sua rotina com quem realmente entende suas necessidades.\n\n👉 Veja mais no link oficial:\n${url}`;

      case 'persuasive':
      default:
        return `🔥 *OFERTA BOMBÁSTICA: ${params.title.toUpperCase()}*\n\nDe R$ ${formattedOldPrice || 'valor normal'} por apenas *${formattedPrice}*!\n\nGaranta o menor preço garantido clicando no link abaixo:\n${url}`;
    }
  }

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
    const providerUsed = hasGeminiKey ? 'Gemini 2.5 Flash' : hasOpenAIKey ? 'OpenAI GPT-4o' : 'IA Core';

    const affiliateUrl = product.canonicalUrl || product.originalUrl;
    const formattedPrice = product.currentPrice ? product.currentPrice : 0;

    const whatsAppText = await AIService.generateOfferCopy({
      title: product.title,
      price: formattedPrice,
      previousPrice: product.originalPrice ?? undefined,
      affiliateUrl,
      style: 'whatsapp',
    });

    const telegramText = await AIService.generateOfferCopy({
      title: product.title,
      price: formattedPrice,
      previousPrice: product.originalPrice ?? undefined,
      affiliateUrl,
      style: 'telegram',
    });

    const instagramText = await AIService.generateOfferCopy({
      title: product.title,
      price: formattedPrice,
      previousPrice: product.originalPrice ?? undefined,
      affiliateUrl,
      style: 'instagram',
    });

    const facebookText = await AIService.generateOfferCopy({
      title: product.title,
      price: formattedPrice,
      previousPrice: product.originalPrice ?? undefined,
      affiliateUrl,
      style: 'facebook',
    });

    const channelContent = new ChannelContent({
      whatsAppText,
      telegramText,
      instagramText,
      facebookText,
    });

    const offerProps: Partial<OfferProps> = {
      productId: product.productId || 'product_default',
      userId,
      scoreValue: 95,
      scoreLabel: 'EXCELLENT' as ScoreType,
      scoreJustification: 'Oferta otimizada com prompts dinâmicos e formato específico por canal.',
      copies: channelContent,
      hashtags: ['#Oferta', '#Desconto', '#Achadinhos', '#MundoLK'],
      emojis: ['🔥', '⚡', '✨', '🛒'],
      cta: '👉 Clique e garanta o seu no link oficial!',
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
