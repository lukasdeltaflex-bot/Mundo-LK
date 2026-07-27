import { ProductKnowledgeSheet } from './ProductKnowledgeBuilder';

export class AIPromptBuilder {
  public buildJSONPrompt(knowledge: ProductKnowledgeSheet, style: string): string {
    const payload = {
      tipoProduto: knowledge.title,
      categoria: knowledge.category,
      marca: knowledge.brand,
      precoAtual: knowledge.currentPriceFormatted,
      precoAnterior: knowledge.originalPriceFormatted || null,
      descontoPercentual: `${knowledge.discountPercentage}%`,
      marketplace: knowledge.marketplace,
      frete: knowledge.shippingInfo,
      vendedor: knowledge.sellerInfo,
      avaliacoes: knowledge.ratingsInfo || null,
      destaquePrecoCaiu: knowledge.priceDropHighlight || null,
      beneficiosChave: knowledge.keyFeatures,
      estiloDesejado: style,
      url: knowledge.originalUrl,
    };

    return `
DADOS ESTRUTURADOS DO PRODUTO (CONHECIMENTO CONFIRMADO):
${JSON.stringify(payload, null, 2)}
`.trim();
  }
}
