import { v4 as uuidv4 } from 'uuid';
import { MarketplaceSlug, MarketplaceTrendProps } from '../../domain/entities/marketplace-trend.entity';
import { TrendCollectionJob } from '../../domain/entities/trend-collection-job.entity';
import { IMarketplaceTrendProvider } from '../../domain/ports/IMarketplaceTrendProvider';
import { MercadoLivreTrendProvider } from '../providers/MercadoLivreTrendProvider';
import { ShopeeTrendProvider } from '../providers/ShopeeTrendProvider';
import { FirestoreMarketplaceTrendRepository } from '../../../infrastructure/firebase/repositories/firestore-marketplace-trend.repository';
import { FirestoreTrendCollectionJobRepository } from '../../../infrastructure/firebase/repositories/firestore-trend-collection-job.repository';
import { AuditLogService } from './AuditLogService';

/**
 * TrendIntelligenceService — Serviço Global de Inteligência de Mercado (Release 2.3.1)
 *
 * Ponto único e exclusivo de acesso a dados de tendência.
 * Encapsula a coleta por provedores oficiais (MercadoLivre, Shopee), registra auditoria
 * via TrendCollectionJob e impede acesso não autorizado da UI à coleção marketplace_trends.
 */
export class TrendIntelligenceService {
  private static instance: TrendIntelligenceService;
  private trendRepo = new FirestoreMarketplaceTrendRepository();
  private jobRepo = new FirestoreTrendCollectionJobRepository();
  private providers: Map<MarketplaceSlug, IMarketplaceTrendProvider> = new Map();

  private constructor() {
    this.registerProvider(new MercadoLivreTrendProvider());
    this.registerProvider(new ShopeeTrendProvider());
  }

  public static getInstance(): TrendIntelligenceService {
    if (!TrendIntelligenceService.instance) {
      TrendIntelligenceService.instance = new TrendIntelligenceService();
    }
    return TrendIntelligenceService.instance;
  }

  public registerProvider(provider: IMarketplaceTrendProvider): void {
    this.providers.set(provider.marketplaceSlug, provider);
  }

  /**
   * Executa um ciclo de coleta de tendências para um marketplace específico.
   * Grava histórico no TrendCollectionJob.
   */
  public async collectTrends(marketplaceSlug: MarketplaceSlug, limit: number = 10): Promise<MarketplaceTrendProps[]> {
    const jobId = `trend_job_${uuidv4()}`;
    const job = new TrendCollectionJob({
      id: jobId,
      marketplaceSlug,
      status: 'RUNNING',
      trendsCollected: 0,
      errorsCount: 0,
      startedAt: new Date().toISOString(),
    });

    await this.jobRepo.save(job);

    try {
      const provider = this.providers.get(marketplaceSlug);
      if (!provider) {
        throw new Error(`Provedor de tendências não registrado para ${marketplaceSlug}`);
      }

      const rawTrends = await provider.fetchTopTrends({ limit });

      for (const trend of rawTrends) {
        await this.trendRepo.save(trend);
      }

      job.status = 'COMPLETED';
      job.trendsCollected = rawTrends.length;
      job.finishedAt = new Date().toISOString();
      await this.jobRepo.save(job);

      AuditLogService.getInstance().log({
        userId: 'system',
        tenantId: 'system',
        action: 'TREND_COLLECTION_COMPLETED',
        module: 'trend_intelligence',
        entity: 'TrendCollectionJob',
        entityId: jobId,
        metadata: { marketplaceSlug, collected: rawTrends.length },
      });

      return rawTrends;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.warn(`[TrendIntelligenceService] Falha na coleta de ${marketplaceSlug}:`, errorMsg);

      job.status = 'FAILED';
      job.errorsCount += 1;
      job.errorMessage = errorMsg;
      job.finishedAt = new Date().toISOString();
      await this.jobRepo.save(job);

      AuditLogService.getInstance().log({
        userId: 'system',
        tenantId: 'system',
        action: 'TREND_COLLECTION_FAILED',
        module: 'trend_intelligence',
        entity: 'TrendCollectionJob',
        entityId: jobId,
        metadata: { marketplaceSlug, error: errorMsg },
      });

      return [];
    }
  }

  /**
   * Fornece tendências formatadas para consumo interno por outros serviços (ex: OpportunityScoreEngine).
   * A UI nunca consulta marketplace_trends diretamente.
   */
  public async getTrendsForAnalysis(
    marketplaceSlug: MarketplaceSlug,
    limit: number = 20
  ): Promise<MarketplaceTrendProps[]> {
    const trends = await this.trendRepo.findLatestByMarketplace(marketplaceSlug, limit);
    if (trends.length === 0) {
      // Se a coleção estiver vazia, executa coleta em tempo real via provider
      return this.collectTrends(marketplaceSlug, limit);
    }
    return trends.map((t) => ({
      id: t.id,
      marketplaceSlug: t.marketplaceSlug,
      category: t.category,
      keyword: t.keyword,
      searchVolumeGrowthPct: t.searchVolumeGrowthPct,
      avgPrice: t.avgPrice,
      competitionLevel: t.competitionLevel,
      collectedAt: t.collectedAt,
    }));
  }
}
