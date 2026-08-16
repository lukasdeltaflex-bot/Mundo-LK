import { ProductExtractionResult } from '../entities/ProductExtractionResult';
import { OfferContext, VerifiedOfferCommercialData } from '../entities/UniversalMarketplaceContext';

export class MarketplaceDataValidator {
  /**
   * Sanitiza e valida os dados de produto provenientes do scraper/API.
   * Garante que a IA NUNCA receba dados inventados ou nao confirmados.
   */
  public static validateAndBuildOfferContext(product: ProductExtractionResult): OfferContext {
    const rawPrice = product.currentPrice ?? 0;
    const formattedCurrentPrice = rawPrice > 0 ? `R$ ${rawPrice.toFixed(2).replace('.', ',')}` : 'Preço sob consulta';

    const rawPreviousPrice = product.originalPrice ?? undefined;
    const formattedPreviousPrice = rawPreviousPrice && rawPreviousPrice > rawPrice ? `R$ ${rawPreviousPrice.toFixed(2).replace('.', ',')}` : undefined;

    const discountPercentage = product.discountPercentage > 0 ? `${product.discountPercentage}% OFF` : '';

    // ── VALIDAÇÃO RÍGIDA ANTI-HALUCINAÇÃO DADOS COMERCIAIS ──
    const freteGratis = Boolean(product.freeShipping);
    const tipoFrete = product.shippingType && product.shippingType.trim().length > 0 ? product.shippingType.trim() : undefined;

    const sellerStr = String(product.sellerName || '');
    const sellerRatingNum = typeof product.sellerRating === 'number' ? product.sellerRating : 0;
    const vendedorOficial = Boolean(product.mall || sellerStr.toLowerCase().includes('oficial'));
    const avaliacaoVendedor = sellerRatingNum > 0 ? `${sellerRatingNum}★ (${sellerStr})` : (sellerStr || undefined);

    const avaliacaoProduto = product.rating > 0 ? `${product.rating} / 5 (${product.reviewCount || 0} avaliações)` : undefined;

    const dadosComerciaisValidados: VerifiedOfferCommercialData = {
      freteGratis,
      tipoFrete,
      parcelamentoDisponivel: Boolean(product.installments),
      parcelamentoMaximo: product.installments || undefined,
      vendedorOficial,
      avaliacaoVendedor,
      avaliacaoProduto,
      descontoConfirmado: discountPercentage || undefined,
      estoqueConfirmado: true,
    };

    return {
      productId: product.productId || `prod_${Date.now()}`,
      title: (product.title || 'Produto Sem Título').slice(0, 150).trim(),
      currentPrice: formattedCurrentPrice,
      currentPriceAmount: rawPrice,
      previousPrice: formattedPreviousPrice,
      previousPriceAmount: rawPreviousPrice,
      discountPercentage,
      dadosComerciaisValidados,
    };
  }

  /**
   * Constrói as instruções de veracidade para serem injetadas no prompt da IA.
   */
  public static buildAntiHallucinationInstructions(dados: VerifiedOfferCommercialData): string {
    const rules: string[] = [];

    rules.push('TRAVAS RÍGIDAS DE VERACIDADE COMERCIAL (ANTI-HALUCINAÇÃO):');

    if (dados.freteGratis) {
      rules.push('✓ FRETE GRÁTIS CONFIRMADO: Você PODE mencionar frete grátis na copy.');
    } else {
      rules.push('❌ FRETE GRÁTIS NÃO CONFIRMADO: PROIBIDO mencionar "Frete Grátis" ou "Envio Gratuito" na copy!');
    }

    if (dados.parcelamentoDisponivel && dados.parcelamentoMaximo) {
      rules.push(`✓ PARCELAMENTO CONFIRMADO: Você PODE citar a condição: "${dados.parcelamentoMaximo}".`);
    } else {
      rules.push('❌ PARCELAMENTO SEM DETALHES: Não invente número de parcelas ou juros zero.');
    }

    if (dados.vendedorOficial) {
      rules.push('✓ LOJA OFICIAL CONFIRMADA: Você PODE utilizar "Loja Oficial" ou "Vendedor Verificado".');
    } else {
      rules.push('❌ LOJA OFICIAL NÃO CONFIRMADA: Não afirme ser vendedor oficial.');
    }

    if (!dados.avaliacaoProduto) {
      rules.push('❌ AVALIAÇÕES INDISPONÍVEIS: Não invente pontuações de estrelas ou número de compradores.');
    }

    rules.push('❌ PROIBIDO INVENTAR ATRIBUTOS: Nunca invente tempo de fixação (ex: "12h de fixação"), prazos de garantia, brindes, produto original garantido ou especificações técnicas que NÃO constem na Descrição / Detalhes do produto.');
    rules.push('❌ PROIBIDO TEMPLATE GENÉRICO REPETITIVO: Evite aberturas mecânicas como "🔥 OFERTA IMPERDÍVEL" ou bordões clichês. A copy DEVE ser 100% personalizada e inspirada no produto real.');

    return rules.join('\n');
  }
}
