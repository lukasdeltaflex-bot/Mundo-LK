import { v4 as uuidv4 } from 'uuid';
import { MarketplaceHealth, HealthStatus } from '../../../domain/entities/marketplace-health.entity';
import { MarketplaceConnectionSlug } from '../../../domain/entities/marketplace-connection.entity';
import { MarketplaceStatistics } from '../../../domain/value-objects/MarketplaceStatistics';
import { FirestoreMarketplaceHealthRepository } from '../../../../infrastructure/firebase/repositories/firestore-marketplace-health.repository';
import { FirestoreMarketplaceOperationLogRepository } from '../../../../infrastructure/firebase/repositories/firestore-marketplace-operation-log.repository';
import { FirestoreMarketplaceConnectionRepository } from '../../../../infrastructure/firebase/repositories/firestore-marketplace-connection.repository';
import { FirestoreMarketplaceListingRepository } from '../../../../infrastructure/firebase/repositories/firestore-marketplace-listing.repository';
import { MarketplaceConnectionService } from './MarketplaceConnectionService';
import { JobQueueService } from '../JobQueueService';
import { AuditLogService } from '../AuditLogService';

interface CacheItem {
  health: MarketplaceHealth;
  cachedAt: number;
}

/**
 * MarketplaceHealthService — Torre de Controle Operacional (Release 2.2.8)
 *
 * Diagnostica a saúde das conexões de marketplace com cache in-memory de 2 minutos,
 * separação estrita entre saúde e métricas (MarketplaceStatistics), gravações eficientes no Firestore
 * e enfileiramento assíncrono via JobQueueService.
 */
export class MarketplaceHealthService {
  private static instance: MarketplaceHealthService;
  private healthRepo = new FirestoreMarketplaceHealthRepository();
  private opLogRepo = new FirestoreMarketplaceOperationLogRepository();
  private connRepo = new FirestoreMarketplaceConnectionRepository();
  private listingRepo = new FirestoreMarketplaceListingRepository();

  private cache: Map<string, CacheItem> = new Map();
  private readonly CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos

  private constructor() {}

  public static getInstance(): MarketplaceHealthService {
    if (!MarketplaceHealthService.instance) {
      MarketplaceHealthService.instance = new MarketplaceHealthService();
    }
    return MarketplaceHealthService.instance;
  }

  /**
   * Checa a saúde da conexão com suporte a cache de 2 minutos.
   */
  public async checkHealth(
    userId: string,
    marketplaceSlug: MarketplaceConnectionSlug,
    forceRefresh: boolean = false
  ): Promise<MarketplaceHealth> {
    const cacheKey = `${userId}_${marketplaceSlug}`;
    const nowMs = Date.now();
    const cached = this.cache.get(cacheKey);

    if (!forceRefresh && cached && nowMs - cached.cachedAt < this.CACHE_TTL_MS) {
      return cached.health;
    }

    const startTime = Date.now();
    let status: HealthStatus = 'OFFLINE';
    let apiStatus = 'HTTP 500 Connection Timeout';
    let tokenStatus = 'CHAVE AUSENTE OU NULADA';
    let healthScore = 100;
    let lastError: string | null = null;

    try {
      // Teste real de conexão
      const testRes = await MarketplaceConnectionService.getInstance().testRealConnection(marketplaceSlug);
      const latencyMs = testRes.latencyMs || Date.now() - startTime;

      if (testRes.success) {
        status = 'ONLINE';
        apiStatus = 'HTTP 200 OK';
        tokenStatus = 'VÁLIDO';
        healthScore = latencyMs > 500 ? 85 : 100;
      } else {
        const isTokenErr = testRes.message.toLowerCase().includes('token') || testRes.message.toLowerCase().includes('unauthorized');
        status = isTokenErr ? 'WARNING' : 'ERROR';
        apiStatus = 'FALHA DE RESPOSTA';
        tokenStatus = isTokenErr ? 'TOKEN EXPIRADO / INVÁLIDO' : 'ERRO DE AUTENTICAÇÃO';
        healthScore = isTokenErr ? 40 : 20;
        lastError = testRes.message;
      }

      const newHealth = new MarketplaceHealth({
        id: `health_${userId}_${marketplaceSlug}`,
        userId,
        tenantId: userId,
        marketplaceSlug,
        status,
        healthScore,
        latencyMs,
        apiStatus,
        tokenStatus,
        lastCheckedAt: new Date().toISOString(),
        lastError,
      });

      // Grava no Firestore apenas se houve mudança real de estado (otimização de escritas)
      const existing = await this.healthRepo.findByUserIdAndSlug(userId, marketplaceSlug);
      if (!existing || existing.status !== newHealth.status || existing.healthScore !== newHealth.healthScore) {
        await this.healthRepo.save(newHealth);

        // Registra transição em marketplace_operation_logs
        await this.opLogRepo.record({
          id: `log_${uuidv4()}`,
          userId,
          tenantId: userId,
          type: 'CHECK_HEALTH',
          marketplaceSlug,
          status: newHealth.status === 'ONLINE' ? 'SUCCESS' : 'FAILED',
          durationMs: latencyMs,
          metadata: { status: newHealth.status, healthScore },
        });
      }

      // Atualiza cache in-memory
      this.cache.set(cacheKey, { health: newHealth, cachedAt: nowMs });
      return newHealth;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      const fallbackHealth = new MarketplaceHealth({
        id: `health_${userId}_${marketplaceSlug}`,
        userId,
        tenantId: userId,
        marketplaceSlug,
        status: 'ERROR',
        healthScore: 0,
        latencyMs: Date.now() - startTime,
        apiStatus: 'FALHA INTERNA',
        tokenStatus: 'ERRO',
        lastCheckedAt: new Date().toISOString(),
        lastError: errorMsg,
      });

      this.cache.set(cacheKey, { health: fallbackHealth, cachedAt: nowMs });
      return fallbackHealth;
    }
  }

  /**
   * Calcula estatísticas operacionais sem poluir a saúde da conexão.
   */
  public async getStatistics(userId: string): Promise<MarketplaceStatistics> {
    const res = await this.listingRepo.findPagedByUserId(userId, 100);
    const listings = res.items;

    const publishedListings = listings.filter((l) => l.status === 'PUBLISHED').length;
    const failedListings = listings.filter((l) => l.status === 'FAILED').length;
    const pausedListings = listings.filter((l) => l.status === 'PAUSED').length;
    const draftListings = listings.filter((l) => l.status === 'DRAFT').length;
    const expiredTokens = listings.filter((l) => l.status === 'EXPIRED_TOKEN').length;

    return new MarketplaceStatistics({
      totalListings: listings.length,
      publishedListings,
      failedListings,
      pausedListings,
      draftListings,
      expiredTokens,
    });
  }

  /**
   * Enfileira Sincronização em Lote via JobQueueService.
   */
  public async enqueueBatchSync(userId: string): Promise<void> {
    await JobQueueService.getInstance().enqueue({
      userId,
      tenantId: userId,
      type: 'SYNC_MARKETPLACE_LISTING',
      executionKey: `batch_sync_${userId}_${Date.now()}`,
      payload: { userId, batch: true },
    });

    AuditLogService.getInstance().log({
      userId,
      tenantId: userId,
      action: 'SYNC_STARTED',
      module: 'operations_center',
      entity: 'JobQueue',
      entityId: 'batch_sync',
      metadata: { userId },
    });
  }

  /**
   * Executa diagnóstico global de todos os canais.
   */
  public async checkAllHealth(userId: string): Promise<MarketplaceHealth[]> {
    const slugs: MarketplaceConnectionSlug[] = ['mercadolivre', 'shopee', 'whatsapp', 'gemini', 'openai'];
    const results: MarketplaceHealth[] = [];

    for (const slug of slugs) {
      const h = await this.checkHealth(userId, slug, true);
      results.push(h);
    }
    return results;
  }
}
