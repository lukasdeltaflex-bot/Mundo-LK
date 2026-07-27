import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';
import { ProductSnapshot, analyzePriceDelta } from '../../../core/domain/entities/ProductSnapshot';

export interface ProductKnowledgeSheet {
  title: string;
  category: string;
  brand: string;
  currentPriceFormatted: string;
  originalPriceFormatted?: string;
  discountPercentage: number;
  marketplace: string;
  shippingInfo: string;
  sellerInfo: string;
  ratingsInfo?: string;
  imageUrl: string;
  originalUrl: string;
  priceDropHighlight?: string;
  keyFeatures: string[];
}

export class ProductKnowledgeBuilder {
  public buildKnowledgeSheet(product: ProductExtractionResult, previousSnapshot: ProductSnapshot | null = null): ProductKnowledgeSheet {
    const currentPriceFormatted = product.currentPrice ? `R$ ${product.currentPrice.toFixed(2).replace('.', ',')}` : 'Preço sob consulta';
    const originalPriceFormatted = product.originalPrice ? `R$ ${product.originalPrice.toFixed(2).replace('.', ',')}` : undefined;

    const priceDelta = analyzePriceDelta(previousSnapshot, product.currentPrice, product.discountPercentage);

    const keyFeatures: string[] = [];
    if (product.freeShipping) keyFeatures.push('Frete Grátis');
    if (product.prime) keyFeatures.push('Entrega Prime');
    if (product.full) keyFeatures.push('Envio FULL Mercado Livre');
    if (product.mall) keyFeatures.push('Selo de Loja Oficial Mall');
    if (product.coupon) keyFeatures.push(`Cupom: ${product.coupon}`);
    if (product.installments) keyFeatures.push(`Parcelamento: ${product.installments}`);

    return {
      title: product.title.trim(),
      category: product.category || 'Geral',
      brand: product.brand || 'Não informada',
      currentPriceFormatted,
      originalPriceFormatted,
      discountPercentage: product.discountPercentage,
      marketplace: product.marketplace,
      shippingInfo: product.shippingType || (product.freeShipping ? 'Frete Grátis' : 'Envio Padrão'),
      sellerInfo: product.sellerName || 'Loja Oficial',
      ratingsInfo: product.rating > 0 ? `${product.rating} / 5 (${product.reviewCount} avaliações)` : undefined,
      imageUrl: product.image,
      originalUrl: product.originalUrl || product.canonicalUrl,
      priceDropHighlight: priceDelta.message,
      keyFeatures,
    };
  }
}
