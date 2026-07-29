import { AffiliateOffer } from '../../entities/affiliate-offer.entity';
import { ProductStrategy } from './AIStrategyEngine';

export class WhatsAppChannelGenerator {
  public static generate(offer: AffiliateOffer, strategy: ProductStrategy): string {
    const formattedPrice = `R$ ${offer.pricing.currentPrice.toFixed(2)}`;
    const formattedOldPrice = offer.pricing.originalPrice ? `R$ ${offer.pricing.originalPrice.toFixed(2)}` : '';
    const url = offer.affiliateLink.affiliateUrl;

    const discountTag = offer.pricing.discountPercentage ? ` 🔥 *${offer.pricing.discountPercentage}% OFF*` : '';

    return `🔥 *ACHADO DO DIA!* ${discountTag}\n\n📦 *${offer.productData.title}*\n\n💡 *Por que vale a pena?*\n${strategy.mainBenefit}\n\n💰 Por apenas: *${formattedPrice}*${formattedOldPrice ? ` ~(De: ${formattedOldPrice})~` : ''}\n\n⚡ *Atenção:* ${strategy.buyingTrigger}. As ofertas costumam esgotar rápido!\n\n👉 *Garanta o seu no link oficial abaixo:*\n${url}`;
  }
}
