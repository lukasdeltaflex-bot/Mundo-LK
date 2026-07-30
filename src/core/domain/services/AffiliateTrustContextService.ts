import { ProductExtractionResult } from '../entities/ProductExtractionResult';

export interface AffiliateTrustDirectives {
  trustPhraseAllowed: boolean;
  trustDirectives: string[];
  sellerBadgeText?: string;
  commissionEstimateText?: string;
}

export class AffiliateTrustContextService {
  public static buildTrustDirectives(product: ProductExtractionResult): AffiliateTrustDirectives {
    const trustDirectives: string[] = [];
    let trustPhraseAllowed = false;

    const sellerName = product.sellerName ? product.sellerName.trim() : '';
    const isOfficial = Boolean(product.mall || sellerName.toLowerCase().includes('oficial'));
    const rating = product.rating || 0;

    if (isOfficial) {
      trustPhraseAllowed = true;      trustDirectives.push(`✓ VENDEDOR OFICIAL: Pode mencionar "${sellerName || 'Loja Oficial'}" como fonte confiável.`);
    }

    if (rating >= 4.5) {
      trustPhraseAllowed = true;
      trustDirectives.push(`✓ AVALIAÇÃO EXCELENTE (${rating}★): Pode destacar alta aprovação dos compradores.`);
    }

    if (product.full || product.prime) {
      trustPhraseAllowed = true;
      trustDirectives.push(`✓ LOGÍSTICA EXPRESSA (${product.prime ? 'Prime' : 'Full'}): Pode destacar envio expresso com garantia de entrega.`);
    }

    return {
      trustPhraseAllowed,
      trustDirectives,
      sellerBadgeText: isOfficial ? 'Loja Oficial Verificada' : (sellerName || undefined),
      commissionEstimateText: 'Comissão de Afiliado Garantida',
    };
  }
}
