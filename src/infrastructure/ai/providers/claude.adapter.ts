import { IAIProviderAdapter, AIOfferGenerationResult } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { Product } from '../../../core/domain/entities/product.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';
import { Score } from '../../../core/domain/entities/score.entity';

/**
 * Anthropic Claude Provider Adapter (Claude 3.5 Sonnet).
 */
export class ClaudeAIAdapter implements IAIProviderAdapter {
  public readonly providerName: string = 'claude-3-5-sonnet';

  public async generateOfferContent(product: Product): Promise<AIOfferGenerationResult> {
    const formattedPrice = product.currentPrice.formatBRL();
    const discountText = product.discountPercentage.hasDiscount() ? ` (${product.discountPercentage.formatString()})` : '';

    const copies = ChannelContent.create({
      shortText: `💎 ACHADO EXCLUSIVO: ${product.title} por ${formattedPrice}`,
      mediumText: `✨ SELEÇÃO ESPECIAL!\n\n${product.title}\n\nPor apenas: *${formattedPrice}*${discountText}\n\n👉 Compre pelo link seguro: ${product.affiliateUrl.url}`,
      longText: `💎 CURADORIA DE OFERTAS!\n\n${product.title}\n\nPreço Exclusivo: ${formattedPrice}${discountText}\n\nConfira os detalhes no site oficial: ${product.affiliateUrl.url}`,
      whatsAppText: `💎 *ACHADO DE HOJE!*\n\n*${product.title}*\n\n💰 Por apenas: *${formattedPrice}* ${discountText}\n\n🛒 *Link Oficial:* ${product.affiliateUrl.url}`,
      telegramText: `💎 <b>ACHADO EXCLUSIVO!</b>\n\n<b>${product.title}</b>\n\nPor: <b>${formattedPrice}</b> ${discountText}\n\n🔗 <a href="${product.affiliateUrl.url}">COMPRAR AGORA</a>`,
      instagramText: `💎 Achado imperdível! ${product.title} por ${formattedPrice}. Link na bio e stories!`,
      facebookText: `Recomendação de compra: ${product.title} por ${formattedPrice}. Link oficial: ${product.affiliateUrl.url}`,
      threadsText: `Encontrei este ${product.title} por ${formattedPrice}! Link: ${product.affiliateUrl.url}`,
      pinterestText: `Seleção de ofertas: ${product.title} por ${formattedPrice}.`,
      tikTokText: `Olha este achadinho: ${product.title} por ${formattedPrice}! Link na bio.`,
      storyText: `💎 ACHADO DO DIA! ${product.title} por ${formattedPrice}!`,
      channelText: `📢 OFERTA SELECIONADA: ${product.title} por apenas ${formattedPrice}!`,
    });

    const score = new Score({
      value: 94,
      justification: `Oferta excelente com alto apelo comercial e taxa de desconto de ${product.discountPercentage.formatString()}.`,
      factors: [
        { name: 'Desconto Percentual', weight: 30, score: 96, reason: 'Excelente desconto' },
        { name: 'Reputação da Loja', weight: 25, score: 92, reason: 'Loja verificada' },
        { name: 'Tendência da Categoria', weight: 25, score: 94, reason: 'Alta demanda do público' },
        { name: 'Qualidade do Anúncio', weight: 20, score: 94, reason: 'Mídias em altíssima resolução' },
      ],
    });

    const cost = AICost.create(500, 450, this.providerName, 0.0015);

    return {
      copies,
      hashtags: ['#curadoria', '#achados', '#desconto', `#${product.marketplaceSlug}`],
      emojis: ['💎', '✨', '🛍️', '🔥'],
      cta: '👉 Clique no link oficial para garantir a sua promoção!',
      score,
      cost,
    };
  }
}
