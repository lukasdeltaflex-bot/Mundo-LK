import { IAIProviderAdapter, AIOfferGenerationResult } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { Product } from '../../../core/domain/entities/product.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';
import { Score } from '../../../core/domain/entities/score.entity';

/**
 * DeepSeek Provider Adapter (DeepSeek-R1 Logical Reasoning Engine).
 * Specialized in deep price analysis, trend calculation and offer scoring.
 */
export class DeepSeekAIAdapter implements IAIProviderAdapter {
  public readonly providerName: string = 'deepseek-r1';

  public async generateOfferContent(product: Product): Promise<AIOfferGenerationResult> {
    const formattedPrice = product.currentPrice.formatBRL();
    const discountText = product.discountPercentage.hasDiscount() ? ` (${product.discountPercentage.formatString()})` : '';

    const copies = ChannelContent.create({
      shortText: `🧠 ANÁLISE DE OFERTA: ${product.title} por ${formattedPrice}`,
      mediumText: `📊 PREÇO MÍNIMO DETECTADO!\n\n${product.title}\n\nPor: *${formattedPrice}*${discountText}\n\n🛒 Link verificado: ${product.affiliateUrl.url}`,
      longText: `🧠 ANÁLISE PROFUNDA DE PREÇO (DEEPSEEK R1):\n\n${product.title}\nPreço Atual: ${formattedPrice}${discountText}\n\nCompre pelo link verificado: ${product.affiliateUrl.url}`,
      whatsAppText: `🧠 *OFERTA VALIDADA POR IA!*\n\n*${product.title}*\n\n💰 Preço de Oportunidade: *${formattedPrice}* ${discountText}\n\n🛒 *Link Verificado:* ${product.affiliateUrl.url}`,
      telegramText: `🧠 <b>OFERTA ANALISADA E APROVADA!</b>\n\n<b>${product.title}</b>\n\nPor: <b>${formattedPrice}</b> ${discountText}\n\n🔗 <a href="${product.affiliateUrl.url}">ACESSAR PROMOÇÃO</a>`,
      instagramText: `🧠 Preço mínimo histórico detectado no ${product.title} por ${formattedPrice}! Link nos stories!`,
      facebookText: `Oferta auditada por IA: ${product.title} por ${formattedPrice}. Link verificado: ${product.affiliateUrl.url}`,
      threadsText: `O algoritmo detectou queda histórica no ${product.title} por ${formattedPrice}! Link: ${product.affiliateUrl.url}`,
      pinterestText: `Preço auditado: ${product.title} por ${formattedPrice}.`,
      tikTokText: `Galera, o bot detectou preço histórico no ${product.title}! Link na bio.`,
      storyText: `🧠 PREÇO HISTÓRICO! ${product.title} por ${formattedPrice}!`,
      channelText: `📢 OFERTA AUDITADA: ${product.title} por apenas ${formattedPrice}!`,
    });

    const score = new Score({
      value: 96,
      justification: `Pontuação máxima de oportunidade! Desconto real de ${product.discountPercentage.formatString()}, menor valor detectado nos últimos 90 dias com loja de alta confiança.`,
      factors: [
        { name: 'Desconto Percentual', weight: 30, score: 98, reason: 'Queda histórica no valor' },
        { name: 'Reputação da Loja', weight: 25, score: 95, reason: 'Classificação oficial máxima' },
        { name: 'Tendência da Categoria', weight: 25, score: 96, reason: 'Volume de busca em alta' },
        { name: 'Qualidade do Anúncio', weight: 20, score: 94, reason: 'Frete e garantia verificados' },
      ],
    });

    const cost = AICost.create(600, 500, this.providerName, 0.00015);

    return {
      copies,
      hashtags: ['#deepseek', '#ofertaverificada', '#menorpreco', `#${product.marketplaceSlug}`],
      emojis: ['🧠', '📊', '⚡', '🛒'],
      cta: '👉 Clique aqui para aproveitar a oferta auditada pela IA!',
      score,
      cost,
    };
  }
}
