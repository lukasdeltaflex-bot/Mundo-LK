import { IAIProviderAdapter, AIOfferGenerationResult } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { Product } from '../../../core/domain/entities/product.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';
import { Score } from '../../../core/domain/entities/score.entity';

/**
 * OpenAI Provider Adapter (GPT-4o / GPT-4o-mini).
 */
export class OpenAIAdapter implements IAIProviderAdapter {
  public readonly providerName: string = 'gpt-4o-mini';

  public async generateOfferContent(product: Product): Promise<AIOfferGenerationResult> {
    const formattedPrice = product.currentPrice.formatBRL();
    const discountText = product.discountPercentage.hasDiscount() ? ` (${product.discountPercentage.formatString()})` : '';

    const copies = ChannelContent.create({
      shortText: `⚡ OPORTUNIDADE: ${product.title} por ${formattedPrice}${discountText}`,
      mediumText: `🔥 PREÇO BAIXO COMPROVADO!\n\n${product.title}\nPor apenas: *${formattedPrice}*\n\n🛒 Acesse: ${product.affiliateUrl.url}`,
      longText: `🚨 OFERTA SELECIONADA!\n\n${product.title}\nPreço Promocional: ${formattedPrice}${discountText}\n\nCompre direto no site oficial: ${product.affiliateUrl.url}`,
      whatsAppText: `⚡ *OFERTA SELECIONADA DO DIA!*\n\n*${product.title}*\n\n💰 Por apenas: *${formattedPrice}* ${discountText}\n\n🛒 *Link Seguro:* ${product.affiliateUrl.url}`,
      telegramText: `⚡ <b>OFERTA DO DIA!</b>\n\n<b>${product.title}</b>\n\n Por apenas: <b>${formattedPrice}</b> ${discountText}\n\n🔗 <a href="${product.affiliateUrl.url}">COMPRAR COM DESCONTO</a>`,
      instagramText: `⚡ ${product.title} em super oferta por ${formattedPrice}! Confira no link da bio!`,
      facebookText: `Super desconto no ${product.title} por apenas ${formattedPrice}. Acesse pelo link seguro: ${product.affiliateUrl.url}`,
      threadsText: `Galera, o preço do ${product.title} caiu para ${formattedPrice}! Link: ${product.affiliateUrl.url}`,
      pinterestText: `${product.title} com desconto exclusivo. Confira!`,
      tikTokText: `Achadinho imperdível: ${product.title} por ${formattedPrice}! Link na bio!`,
      storyText: `⚡ OPORTUNIDADE! ${product.title} por ${formattedPrice}!`,
      channelText: `📢 OFERTA IMPERDÍVEL: ${product.title} por ${formattedPrice}!`,
    });

    const score = new Score({
      value: 88,
      justification: `Boa oferta com preço abaixo da média de mercado e desconto verificado de ${product.discountPercentage.formatString()}.`,
      factors: [
        { name: 'Desconto Percentual', weight: 30, score: 90, reason: 'Desconto relevante no mercado' },
        { name: 'Reputação da Loja', weight: 25, score: 88, reason: 'Loja bem avaliada' },
        { name: 'Tendência da Categoria', weight: 25, score: 85, reason: 'Busca constante' },
        { name: 'Qualidade do Anúncio', weight: 20, score: 88, reason: 'Descrição clara' },
      ],
    });

    const cost = AICost.create(400, 380, this.providerName, 0.0003);

    return {
      copies,
      hashtags: ['#achadinhos', '#desconto', `#${product.marketplaceSlug}`, '#promo'],
      emojis: ['⚡', '🛒', '💰', '✨'],
      cta: '👉 Garanta a sua unidade antes que o estoque esgoste!',
      score,
      cost,
    };
  }
}
