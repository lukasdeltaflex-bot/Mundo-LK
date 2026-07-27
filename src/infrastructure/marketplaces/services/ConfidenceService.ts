import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

export interface ConfidenceBreakdownItem {
  field: string;
  found: boolean;
  score: number;
  maxScore: number;
}

export interface ConfidenceReport {
  score: number; // 0 to 100
  breakdown: ConfidenceBreakdownItem[];
  requiresConfirmation: boolean; // true if score < 80
}

export class ConfidenceService {
  public calculateConfidence(product: Partial<ProductExtractionResult>): ConfidenceReport {
    const hasValidTitle = !!product.title && product.title.trim().length > 3 && !/^\d+$/.test(product.title.trim());
    const hasValidPrice = product.currentPrice !== null && product.currentPrice !== undefined && product.currentPrice > 0;
    const hasValidImage = !!product.image && product.image.trim().length > 10;
    const hasBrandOrCat = (!!product.brand && product.brand !== 'Shopee' && product.brand !== 'Desconhecida') || (!!product.category && product.category !== 'Geral');
    const hasRatingOrShipping = (!!product.rating && product.rating > 0) || !!product.shippingType;

    const breakdown: ConfidenceBreakdownItem[] = [
      { field: 'Título oficial do produto', found: hasValidTitle, score: hasValidTitle ? 30 : 0, maxScore: 30 },
      { field: 'Preço atual válido', found: hasValidPrice, score: hasValidPrice ? 25 : 0, maxScore: 25 },
      { field: 'Imagem principal do produto', found: hasValidImage, score: hasValidImage ? 20 : 0, maxScore: 20 },
      { field: 'Marca ou Categoria', found: hasBrandOrCat, score: hasBrandOrCat ? 10 : 0, maxScore: 10 },
      { field: 'Avaliações ou Informações de Frete', found: hasRatingOrShipping, score: hasRatingOrShipping ? 15 : 0, maxScore: 15 },
    ];

    const totalScore = breakdown.reduce((acc, item) => acc + item.score, 0);

    return {
      score: totalScore,
      breakdown,
      requiresConfirmation: totalScore < 80,
    };
  }
}
