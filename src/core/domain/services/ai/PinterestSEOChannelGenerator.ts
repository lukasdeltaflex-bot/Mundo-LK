import { AffiliateOffer } from '../../entities/affiliate-offer.entity';
import { ProductStrategy } from './AIStrategyEngine';

export class PinterestSEOChannelGenerator {
  public static generate(offer: AffiliateOffer, strategy: ProductStrategy): string {
    const formattedPrice = `R$ ${offer.pricing.currentPrice.toFixed(2)}`;
    const url = offer.affiliateLink.affiliateUrl;

    return `📌 *TÍTULO SEO (PINTEREST / GOOGLE):*\n` +
      `${offer.productData.title} em Promoção - Menor Preço Garantido\n\n` +
      `📝 *DESCRIÇÃO PESQUISÁVEL:*\n` +
      `Procurando por ${offer.productData.title}? Descubra onde comprar com o melhor desconto. ${strategy.mainBenefit}. Preço confirmado de ${formattedPrice}. Ideal para ${strategy.audience}.\n\n` +
      `🔗 *LINK DE COMPRA OFICIAL:*\n${url}`;
  }
}
