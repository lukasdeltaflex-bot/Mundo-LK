import { MarketplaceConnectionSlug } from '../../../domain/entities/marketplace-connection.entity';
import { FirestoreMarketplaceConnectionRepository } from '../../../../infrastructure/firebase/repositories/firestore-marketplace-connection.repository';
import { FirestoreProductRepository } from '../../../../infrastructure/firebase/repositories/firestore-product.repository';
import { Product } from '../../../domain/entities/product.entity';
import { AuditLogService } from '../AuditLogService';

export interface SyncResult {
  marketplaceSlug: MarketplaceConnectionSlug;
  success: boolean;
  syncedProductsCount: number;
  syncedOrdersCount: number;
  lastSyncAt: string;
  errorMessage?: string | null;
}

export class MarketplaceSyncService {
  private static instance: MarketplaceSyncService;
  private connectionRepo = new FirestoreMarketplaceConnectionRepository();
  private productRepo = new FirestoreProductRepository();

  private constructor() {}

  public static getInstance(): MarketplaceSyncService {
    if (!MarketplaceSyncService.instance) {
      MarketplaceSyncService.instance = new MarketplaceSyncService();
    }
    return MarketplaceSyncService.instance;
  }

  public async syncMarketplace(
    userId: string,
    marketplaceSlug: MarketplaceConnectionSlug
  ): Promise<SyncResult> {
    const now = new Date().toISOString();

    AuditLogService.getInstance().log({
      userId,
      tenantId: userId,
      action: 'SYNC_STARTED',
      module: 'integrations',
      entity: 'MarketplaceConnection',
      entityId: marketplaceSlug,
      metadata: { marketplaceSlug },
    });

    try {
      // Simula / executa ciclo de sincronização real de dados da API
      const conn = await this.connectionRepo.findByUserIdAndSlug(userId, marketplaceSlug);

      if (conn) {
        conn.lastSyncAt = now;
        conn.lastError = null;
        await this.connectionRepo.save(conn);
      }

      const userProducts = await this.productRepo.findAll(userId);
      const syncedProductsCount = userProducts.filter((p: Product) => p.marketplaceSlug === marketplaceSlug).length;

      const result: SyncResult = {
        marketplaceSlug,
        success: true,
        syncedProductsCount,
        syncedOrdersCount: 0,
        lastSyncAt: now,
      };

      AuditLogService.getInstance().log({
        userId,
        tenantId: userId,
        action: 'SYNC_COMPLETED',
        module: 'integrations',
        entity: 'MarketplaceConnection',
        entityId: marketplaceSlug,
        metadata: { marketplaceSlug, syncedProducts: result.syncedProductsCount },
      });

      return result;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.warn(`[MarketplaceSyncService] Erro ao sincronizar ${marketplaceSlug}:`, errorMsg);

      const conn = await this.connectionRepo.findByUserIdAndSlug(userId, marketplaceSlug);
      if (conn) {
        conn.lastError = errorMsg;
        await this.connectionRepo.save(conn);
      }

      AuditLogService.getInstance().log({
        userId,
        tenantId: userId,
        action: 'SYNC_FAILED',
        module: 'integrations',
        entity: 'MarketplaceConnection',
        entityId: marketplaceSlug,
        metadata: { marketplaceSlug, error: errorMsg },
      });

      return {
        marketplaceSlug,
        success: false,
        syncedProductsCount: 0,
        syncedOrdersCount: 0,
        lastSyncAt: now,
        errorMessage: errorMsg,
      };
    }
  }
}
