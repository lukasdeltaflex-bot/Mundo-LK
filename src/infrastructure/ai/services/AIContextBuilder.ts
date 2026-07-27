import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

export interface AIProductContext {
  nome: string;
  precoAtual: string;
  precoAntigo?: string;
  desconto: string;
  marketplace: string;
  categoria: string;
  marca: string;
  frete: string;
  cupom?: string;
  avaliacao?: string;
  imagemUrl: string;
  linkOriginal: string;
}

export class AIContextBuilder {
  public buildCleanContext(product: ProductExtractionResult): AIProductContext {
    const precoAtual = product.currentPrice ? `R$ ${product.currentPrice.toFixed(2).replace('.', ',')}` : 'Preço sob consulta';
    const precoAntigo = product.originalPrice ? `R$ ${product.originalPrice.toFixed(2).replace('.', ',')}` : undefined;
    const desconto = product.discountPercentage > 0 ? `${product.discountPercentage}% OFF` : 'Sem desconto registrado';

    return {
      nome: product.title.slice(0, 150).trim(),
      precoAtual,
      precoAntigo,
      desconto,
      marketplace: product.marketplace,
      categoria: product.category || 'Geral',
      marca: product.brand || 'Desconhecida',
      frete: product.shippingType || (product.freeShipping ? 'Frete Grátis' : 'Envio Padrão'),
      cupom: product.coupon || undefined,
      avaliacao: product.rating > 0 ? `${product.rating} / 5 (${product.reviewCount} avaliações)` : undefined,
      imagemUrl: product.image,
      linkOriginal: product.originalUrl || product.canonicalUrl,
    };
  }

  public formatPromptString(context: AIProductContext): string {
    return `
DADOS CONFIRMADOS DO PRODUTO:
- Nome: ${context.nome}
- Preço Atual: ${context.precoAtual}
${context.precoAntigo ? `- Preço Anterior: ${context.precoAntigo}` : ''}
- Desconto: ${context.desconto}
- Marketplace: ${context.marketplace}
- Categoria: ${context.categoria}
- Marca: ${context.marca}
- Frete: ${context.frete}
${context.cupom ? `- Cupom: ${context.cupom}` : ''}
${context.avaliacao ? `- Avaliação: ${context.avaliacao}` : ''}
`.trim();
  }
}
