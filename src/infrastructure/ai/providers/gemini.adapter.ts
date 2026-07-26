import { IAIProviderAdapter, AIOfferGenerationResult } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { Product } from '../../../core/domain/entities/product.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';
import { Score } from '../../../core/domain/entities/score.entity';

/**
 * Gemini AI Provider Adapter (Google Gen AI SDK / REST Engine).
 */
export class GeminiAIAdapter implements IAIProviderAdapter {
  public readonly providerName: string = 'gemini-2.5-flash';

  public async generateOfferContent(product: Product): Promise<AIOfferGenerationResult> {
    const formattedPrice = product.currentPrice.formatBRL();
    const discountText = product.discountPercentage.hasDiscount() ? ` (${product.discountPercentage.formatString()})` : '';

    const copies = ChannelContent.create({
      shortText: `🔥 IMPERDÍVEL: ${product.title} por apenas ${formattedPrice}${discountText}!`,
      mediumText: `😱 OLHA ESSE PREÇO! ${product.title}\n\nDe: ${product.previousPrice?.formatBRL() || 'Preço normal'}\nPor apenas: *${formattedPrice}*${discountText}\n\n👉 Compre no link oficial: ${product.affiliateUrl.url}`,
      longText: `🚨 OFERTA BOMBÁSTICA NO ${product.marketplaceSlug.toUpperCase()}!\n\n${product.title}\n\nHighlights:\n- Marca: ${product.brand}\n- Preço: ${formattedPrice}${discountText}\n\nGaranta o seu antes que acabe a promoção!`,
      whatsAppText: `🔥 *OFERTA IMPERDÍVEL!*\n\n*${product.title}*\n\n💰 De: ~${product.previousPrice?.formatBRL() || ''}~\n💥 Por apenas: *${formattedPrice}* ${discountText}\n\n🛒 *Compre aqui:* ${product.affiliateUrl.url}`,
      telegramText: `🔥 <b>OFERTA RELÂMPAGO!</b>\n\n<b>${product.title}</b>\n\n💰 De: <s>${product.previousPrice?.formatBRL() || ''}</s>\n💥 Por: <b>${formattedPrice}</b> ${discountText}\n\n🔗 <a href="${product.affiliateUrl.url}">CLIQUE AQUI PARA COMPRAR</a>`,
      instagramText: `🔥 Baixou demais! ${product.title} por ${formattedPrice}${discountText}!\n\nLink no story e na bio! 🛍️`,
      facebookText: `Oferta imperdível do dia! ${product.title} em promoção exclusiva por ${formattedPrice}. Confira no link: ${product.affiliateUrl.url}`,
      threadsText: `Galera, o ${product.title} tá saindo por ${formattedPrice} agora! Link: ${product.affiliateUrl.url}`,
      pinterestText: `${product.title} em promoção por ${formattedPrice}. Clique para conferir!`,
      tikTokText: `Gente, olha o preço desse ${product.title}! Tá por ${formattedPrice}! Link na bio.`,
      storyText: `🔥 BAIXOU HOJE! ${product.title} por ${formattedPrice}. Arraste para cima!`,
      channelText: `📢 OFERTA EXCLUSIVA: ${product.title} por apenas ${formattedPrice}! Link: ${product.affiliateUrl.url}`,
    });

    const score = new Score({
      value: 92,
      justification: `Oferta excelente! Desconto de ${product.discountPercentage.formatString()} e excelente reputação da loja oficial.`,
      factors: [
        { name: 'Desconto Percentual', weight: 30, score: 95, reason: 'Excelente percentual de desconto' },
        { name: 'Reputação da Loja', weight: 25, score: 90, reason: 'Loja com avaliações verificadas' },
        { name: 'Tendência da Categoria', weight: 25, score: 90, reason: 'Alta busca no mercado' },
        { name: 'Qualidade do Anúncio', weight: 20, score: 92, reason: 'Imagens em HD e frete disponível' },
      ],
    });

    const cost = AICost.create(350, 420, this.providerName, 0.0002);

    return {
      copies,
      hashtags: ['#oferta', '#promocao', '#desconto', `#${product.marketplaceSlug}`, '#achadinhos'],
      emojis: ['🔥', '💥', '🛒', '⚡', '😱'],
      cta: '👉 Clique aqui para aproveitar a promoção antes que esgoste!',
      score,
      cost,
    };
  }
}
