import { Product } from '../entities/product.entity';

export type SmartTagType =
  | 'Frete Grátis'
  | 'Cupom'
  | 'Oferta Relâmpago'
  | 'Loja Oficial'
  | 'Mais Vendido'
  | 'Menor Preço'
  | 'Últimas Unidades'
  | 'Oferta do Dia'
  | 'Black Friday'
  | 'Liquidação'
  | 'Cashback'
  | 'Excelente Avaliação'
  | 'Entrega Rápida'
  | 'Importado'
  | 'Original'
  | 'Premium';

export class SmartTagEngine {
  public static generateTags(product: Product, scoreValue: number = 85): SmartTagType[] {
    const tags: Set<SmartTagType> = new Set();

    if (product.discountPercentage.value >= 30) {
      tags.add('Menor Preço');
      tags.add('Liquidação');
    }

    if (product.discountPercentage.value >= 40) {
      tags.add('Oferta Relâmpago');
    }

    if (scoreValue >= 90) {
      tags.add('Excelente Avaliação');
      tags.add('Oferta do Dia');
    }

    if (product.brand && ['Xiaomi', 'Apple', 'Samsung', 'Mondo'].includes(product.brand)) {
      tags.add('Original');
      tags.add('Loja Oficial');
    }

    if (product.currentPrice.amount > 1000) {
      tags.add('Premium');
    }

    // Default tags for high conversion
    tags.add('Frete Grátis');
    tags.add('Cupom');

    return Array.from(tags);
  }
}
