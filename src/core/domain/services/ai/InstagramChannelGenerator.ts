import { AffiliateOffer } from '../../entities/affiliate-offer.entity';
import { ProductStrategy } from './AIStrategyEngine';

export class InstagramChannelGenerator {
  public static generate(offer: AffiliateOffer, strategy: ProductStrategy): string {
    const formattedPrice = `R$ ${offer.pricing.currentPrice.toFixed(2)}`;
    const url = offer.affiliateLink.affiliateUrl;

    const hashtags = [
      '#Achadinhos',
      '#OfertaDoDia',
      '#Promoção',
      '#ComprasOnline',
      `#${offer.marketplace === 'shopee' ? 'ShopeeAchados' : 'MercadoLivre'}`,
    ].join(' ');

    return `✨ *O achadinho perfeito que você precisa conhecer!*\n\n🛍️ *${offer.productData.title}*\n\n${strategy.contentAngle}.\n\nPor apenas *${formattedPrice}*! 😱\n\n💬 *Como garantir?*\nComente *"QUERO"* que te envio o link direto no direct ou acesse o link no perfil:\n${url}\n\n${hashtags}`;
  }
}
