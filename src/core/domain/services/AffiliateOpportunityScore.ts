import { AffiliateOffer } from '../entities/affiliate-offer.entity';

export interface ScoreReason {
  label: string;
  points: number;
}

export interface OpportunityScoreResult {
  totalScore: number; // 0 a 100
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  reasons: ScoreReason[];
}

/**
 * AffiliateOpportunityScore — Calculadora Transparente de Oportunidades (Release 2.3.0)
 *
 * Princípio: Cálculo auditável baseado estritamente em fatores reais (desconto, completude, status ativo).
 */
export class AffiliateOpportunityScore {
  public static calculate(offer: AffiliateOffer): OpportunityScoreResult {
    const reasons: ScoreReason[] = [];
    let totalScore = 0;

    // 1. Fator Desconto Confirmado (Até 40 pontos)
    if (offer.pricing.discountPercentage && offer.pricing.discountPercentage > 0) {
      const discountPoints = Math.min(40, Math.round(offer.pricing.discountPercentage * 0.8));
      reasons.push({
        label: `Desconto confirmado de ${offer.pricing.discountPercentage}%`,
        points: discountPoints,
      });
      totalScore += discountPoints;
    } else {
      reasons.push({ label: 'Preço normal sem desconto registrado', points: 10 });
      totalScore += 10;
    }

    // 2. Fator Completude da Ficha (20 pontos)
    const hasMainImg = Boolean(offer.productData.images.main);
    const hasGallery = Array.isArray(offer.productData.images.gallery) && offer.productData.images.gallery.length > 1;
    if (hasMainImg && hasGallery) {
      reasons.push({ label: 'Ficha completa com galeria de imagens HD', points: 20 });
      totalScore += 20;
    } else if (hasMainImg) {
      reasons.push({ label: 'Imagem principal disponível', points: 10 });
      totalScore += 10;
    }

    // 3. Fator Fonte da Verdade & Status (20 pontos)
    if (offer.pricing.sourceStatus === 'CONFIRMED' && offer.status === 'ACTIVE') {
      reasons.push({ label: 'Preço 100% confirmado e oferta ativa', points: 20 });
      totalScore += 20;
    }

    // 4. Fator Recência (Até 20 pontos)
    const hoursOld = (Date.now() - new Date(offer.updatedAt).getTime()) / (1000 * 60 * 60);
    if (hoursOld < 24) {
      reasons.push({ label: 'Atualizado nas últimas 24 horas', points: 20 });
      totalScore += 20;
    } else if (hoursOld < 72) {
      reasons.push({ label: 'Atualizado nos últimos 3 dias', points: 10 });
      totalScore += 10;
    } else {
      reasons.push({ label: 'Atualização superior a 3 dias', points: 5 });
      totalScore += 5;
    }

    totalScore = Math.min(100, Math.max(0, totalScore));

    let tier: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (totalScore >= 75) tier = 'HIGH';
    else if (totalScore >= 50) tier = 'MEDIUM';

    return {
      totalScore,
      tier,
      reasons,
    };
  }
}
