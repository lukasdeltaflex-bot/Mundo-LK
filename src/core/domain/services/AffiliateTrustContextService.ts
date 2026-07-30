import { ProductExtractionResult } from '../entities/ProductExtractionResult';

export interface AffiliateTrustDirectives {
  purchaseConfidenceScore: number; // 0 a 100
  trustPhraseAllowed: boolean;
  trustDirectives: string[];
  sellerBadgeText?: string;
  commissionEstimateText?: string;
}

export class AffiliateTrustContextService {
  public static buildTrustDirectives(product: ProductExtractionResult): AffiliateTrustDirectives {
    const trustDirectives: string[] = [];
    let score = 50; // Score base neutro

    const sellerName = product.sellerName ? product.sellerName.trim() : '';
    const isOfficial = Boolean(product.mall || sellerName.toLowerCase().includes('oficial'));
    const rating = product.rating || 0;

    if (isOfficial) {
      score += 25;
      trustDirectives.push(`✓ VENDEDOR OFICIAL CONFIRMADO: Pode mencionar "${sellerName || 'Loja Oficial'}" como fonte segura.`);
    }

    if (rating >= 4.5) {
      score += 15;
      trustDirectives.push(`✓ AVALIAÇÃO EXCELENTE (${rating}★): Pode destacar alta aprovação dos compradores.`);
    } else if (rating > 0 && rating < 3.8) {
      score -= 20;
    }

    if (product.full || product.prime) {
      score += 10;
      trustDirectives.push(`✓ LOGÍSTICA EXPRESSA (${product.prime ? 'Prime' : 'Full'}): Pode destacar envio expresso garantido.`);
    }

    const purchaseConfidenceScore = Math.min(100, Math.max(0, score));
    const trustPhraseAllowed = purchaseConfidenceScore >= 70;

    // ── PROTEÇÃO RÍGIDA ANTI-CLAIM ──
    if (purchaseConfidenceScore < 60) {
      trustDirectives.push(`❌ PROTEÇÃO ANTI-CLAIM (Confidence Score: ${purchaseConfidenceScore}): NUNCA utilize "Compra 100% Segura", "Vendedor Garantido" ou "Melhor Opção" sem comprovação de reputação.`);
    } else if (purchaseConfidenceScore >= 90) {
      trustDirectives.push(`🛡️ ALTA SEGURANÇA (Confidence Score: ${purchaseConfidenceScore}): Autorizado o uso de selos de confiança e garantia oficial.`);
    }

    return {
      purchaseConfidenceScore,
      trustPhraseAllowed,
      trustDirectives,
      sellerBadgeText: isOfficial ? 'Loja Oficial Verificada' : (sellerName || undefined),
      commissionEstimateText: 'Comissão de Afiliado Garantida',
    };
  }
}
