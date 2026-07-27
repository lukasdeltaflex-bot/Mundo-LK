import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';
import { OfferQualityScore } from '../../../core/domain/entities/OfferQualityScore';

export class OfferBuilder {
  public calculateQualityScore(product: ProductExtractionResult): OfferQualityScore {
    // 1. Price Rating (1-5★)
    let priceRating = 3;
    if (product.currentPrice && product.currentPrice > 0) {
      if (product.currentPrice < 100) priceRating = 5;
      else if (product.currentPrice < 300) priceRating = 4;
      else priceRating = 3;
    }

    // 2. Discount Rating (1-5★)
    let discountRating = 2;
    if (product.discountPercentage >= 40) discountRating = 5;
    else if (product.discountPercentage >= 20) discountRating = 4;
    else if (product.discountPercentage >= 10) discountRating = 3;

    // 3. Shipping Rating (1-5★)
    let shippingRating = 3;
    if (product.freeShipping || product.prime || product.full) shippingRating = 5;

    // 4. Conversion Potential (0-100%)
    const basePotential = (priceRating * 8) + (discountRating * 7) + (shippingRating * 5);
    const ratingBonus = product.rating >= 4.5 ? 10 : product.rating >= 4.0 ? 5 : 0;
    const conversionPotential = Math.min(100, Math.round(basePotential + ratingBonus));

    const overallScore = Math.round((priceRating * 20 + discountRating * 20 + shippingRating * 20 + conversionPotential * 0.4));

    let justification = 'Oferta equilibrada com boa atratividade comercial.';
    if (overallScore >= 85) justification = '🔥 EXCELENTE OPORTUNIDADE: Desconto agressivo e frete facilitado. Alto potencial de conversão!';
    else if (overallScore >= 70) justification = '✅ BOA OFERTA: Produto relevante com preço competitivo para afiliados.';

    return {
      priceRating,
      discountRating,
      shippingRating,
      conversionPotential,
      overallScore,
      justification,
    };
  }
}
