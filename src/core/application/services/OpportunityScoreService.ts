import { v4 as uuidv4 } from 'uuid';
import { MarketplaceSlug } from '../../domain/entities/marketplace-trend.entity';
import { MarketplaceRecommendation } from '../../domain/entities/marketplace-recommendation.entity';
import { TrendIntelligenceService } from './TrendIntelligenceService';
import { OpportunityScore } from '../../domain/value-objects/OpportunityScore';
import { FirestoreMarketplaceRecommendationRepository } from '../../../infrastructure/firebase/repositories/firestore-marketplace-recommendation.repository';
import { FirestoreMarketOpportunityHistoryRepository } from '../../../infrastructure/firebase/repositories/firestore-market-opportunity-history.repository';
import { AuditLogService } from './AuditLogService';

/**
 * OpportunityScoreService — Serviço de Cálculo e Geração de Recomendações (Release 2.3.2)
 *
 * Avalia tendências obtidas exclusivamente via TrendIntelligenceService, aplica o
 * algoritmo OpportunityScore (0-100), gera recomendação acionável para o usuário e grava
 * o histórico de evolução temporal em market_opportunity_history.
 */
export class OpportunityScoreService {
  private static instance: OpportunityScoreService;
  private recRepo = new FirestoreMarketplaceRecommendationRepository();
  private histRepo = new FirestoreMarketOpportunityHistoryRepository();

  private constructor() {}

  public static getInstance(): OpportunityScoreService {
    if (!OpportunityScoreService.instance) {
      OpportunityScoreService.instance = new OpportunityScoreService();
    }
    return OpportunityScoreService.instance;
  }

  /**
   * Avalia tendências e gera recomendações para o usuário especificado.
   */
  public async generateRecommendationsForUser(
    userId: string,
    marketplaceSlug: MarketplaceSlug,
    minScoreThreshold: number = 70
  ): Promise<MarketplaceRecommendation[]> {
    const trendService = TrendIntelligenceService.getInstance();
    const trends = await trendService.getTrendsForAnalysis(marketplaceSlug, 15);
    const generated: MarketplaceRecommendation[] = [];

    for (const t of trends) {
      const breakdown = OpportunityScore.calculate({
        searchVolumeGrowthPct: t.searchVolumeGrowthPct,
        competitionLevel: t.competitionLevel,
        avgPrice: t.avgPrice,
      });

      if (breakdown.finalScore < minScoreThreshold) {
        continue;
      }

      const recId = `rec_${marketplaceSlug}_${t.keyword.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const reasons: string[] = [];

      if (t.searchVolumeGrowthPct >= 100) {
        reasons.push(`Busca em forte alta (+${t.searchVolumeGrowthPct}% no volume recente)`);
      }
      if (t.competitionLevel === 'LOW') {
        reasons.push('Baixa concorrência de ofertas no marketplace');
      }
      if (t.avgPrice >= 80) {
        reasons.push(`Ticket médio de R$ ${t.avgPrice.toFixed(2)} com boa margem de comissão`);
      }

      const recommendation = new MarketplaceRecommendation({
        id: recId,
        userId,
        tenantId: userId,
        productCategory: t.category,
        keyword: t.keyword,
        marketplaceSlug: t.marketplaceSlug,
        opportunityScore: breakdown.finalScore,
        reasons: reasons.length > 0 ? reasons : ['Oportunidade identificada com alto score comercial'],
        suggestedAction: `Criar oferta de "${t.keyword}" na ${t.marketplaceSlug.toUpperCase()} com criativos focados em conversão.`,
        status: 'NEW',
      });

      await this.recRepo.save(recommendation);

      // Grava histórico de evolução do score
      await this.histRepo.record({
        id: `hist_${uuidv4()}`,
        userId,
        tenantId: userId,
        recommendationId: recId,
        keyword: t.keyword,
        marketplaceSlug: t.marketplaceSlug,
        score: breakdown.finalScore,
      });

      generated.push(recommendation);
    }

    AuditLogService.getInstance().log({
      userId,
      tenantId: userId,
      action: 'RECOMMENDATIONS_GENERATED',
      module: 'opportunity_engine',
      entity: 'MarketplaceRecommendation',
      entityId: marketplaceSlug,
      metadata: { count: generated.length, marketplaceSlug },
    });

    return generated;
  }
}
