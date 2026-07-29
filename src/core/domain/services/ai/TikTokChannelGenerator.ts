import { AffiliateOffer } from '../../entities/affiliate-offer.entity';
import { ProductStrategy } from './AIStrategyEngine';

export class TikTokChannelGenerator {
  public static generate(offer: AffiliateOffer, strategy: ProductStrategy): string {
    const formattedPrice = `R$ ${offer.pricing.currentPrice.toFixed(2)}`;
    const url = offer.affiliateLink.affiliateUrl;

    return `🎬 *ROTEIRO DE VÍDEO CURTO (TIKTOK / REELS / SHORTS)*\n\n` +
      `⏱️ *[0-3s - GANCHO INICIAL]:*\n` +
      `"Se você ainda não conhece esse achadinho, tá perdendo dinheiro!"\n\n` +
      `🎥 *[3-10s - DEMONSTRAÇÃO & BENEFÍCIO]:*\n` +
      `Mostre o produto em uso. "${offer.productData.title} que resolve ${strategy.mainBenefit}."\n\n` +
      `💬 *[TEXTO NA TELA]:*\n` +
      `"ACHADO DA SEMANA: Apenas ${formattedPrice} 😱"\n\n` +
      `🎯 *[CHAMADA PARA AÇÃO]:*\n` +
      `"Link no meu perfil da bio ou comente 'QUERO'!"\n\n` +
      `📝 *[LEGENDA PARA PUBLICAR]:*\n` +
      `Olha o preço disso! 😱 ${offer.productData.title} por ${formattedPrice}. Link seguro na bio: ${url} #fyp #viral #achados`;
  }
}
