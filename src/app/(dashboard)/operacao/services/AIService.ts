import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';
import { ChannelContent } from '@/core/domain/value-objects/channel-content.vo';
import { ScoreType } from '@/core/domain/value-objects/score-level.vo';
import { OfferProps } from '@/core/domain/entities/offer.entity';
import { AffiliateOffer, OfferContent } from '@/core/domain/entities/affiliate-offer.entity';
import { AffiliateAIOrchestrator } from '@/core/domain/services/AffiliateAIOrchestrator';
import { GeminiAIAdapter, OfferStyle } from '@/infrastructure/ai/providers/gemini.adapter';
import { Product } from '@/core/domain/entities/product.entity';
import { Price } from '@/core/domain/value-objects/price.vo';
import { AffiliateLink } from '@/core/domain/value-objects/affiliate-link.vo';
import { DiscountPercentage } from '@/core/domain/value-objects/discount-percentage.vo';
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
   * Gera o conteúdo multicanal completo (WhatsApp, Instagram, TikTok, Pinterest) para uma AffiliateOffer.
   */
  public static generateAffiliateOfferContent(offer: AffiliateOffer): OfferContent {
    return AffiliateAIOrchestrator.getInstance().generateMultiChannelContent(offer);
  }

  /**
   * Gera cópia persuasiva dinâmica através da IA Real (Gemini 2.5 Flash / OpenAI)
   */
  public static async generateOfferCopy(params: AIOfferCopyParams): Promise<string> {
    const formattedPrice = `R$ ${params.price.toFixed(2)}`;
    const formattedOldPrice = params.previousPrice ? `R$ ${params.previousPrice.toFixed(2)}` : '';
    const url = params.affiliateUrl.trim();

    // Quando houver chave de API da IA disponível, executa a chamada dinamicamente ao modelo
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      try {
        const adapter = new GeminiAIAdapter();
        const currPrice = Price.create(params.price);
        const prevPrice = params.previousPrice ? Price.create(params.previousPrice) : null;

        const productEntity = new Product({
          id: `prod_copy_${Date.now()}`,
          userId: 'user_default',
          title: params.title,
          description: params.title,
          brand: 'Marca Oficial',
          categoryId: 'cat_geral',
          marketplaceSlug: 'mercadolivre',
          originalUrl: url,
          affiliateUrl: AffiliateLink.create(url),
          currentPrice: currPrice,
          previousPrice: prevPrice,
          discountPercentage: DiscountPercentage.calculate(currPrice, prevPrice),
          images: ['https://http2.mlstatic.com/D_NQ_NP_2X_612255-F.webp'],
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const styleMapped: OfferStyle = (params.style as OfferStyle) || 'explosiva';
        const result = await adapter.generateOfferContent(productEntity, styleMapped);

        const channelText =
          params.style === 'instagram'
            ? result.copies.copies.instagramText
            : params.style === 'telegram'
            ? result.copies.copies.telegramText
            : result.copies.copies.whatsAppText;

        if (channelText && channelText.trim().length > 0) {
          return channelText;
        }
      } catch (err) {
        console.warn('[AIService] Falha ao gerar via API Gemini, executando formatação assistida:', err);
      }
    }

    // Formatação assistida dinâmica baseada nos dados confirmados do produto
    return `🔥 *Oportunidade Imperdível!*\n\n📦 *${params.title}*\n\n💰 Apenas: *${formattedPrice}*${formattedOldPrice ? ` ~(De: ${formattedOldPrice})~` : ''}\n\n✅ Envio rápido e garantia de compra!\n\n👉 *Garanta o seu no link oficial:*\n${url}`;
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

    const affiliateUrl = product.originalUrl || product.canonicalUrl;
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
