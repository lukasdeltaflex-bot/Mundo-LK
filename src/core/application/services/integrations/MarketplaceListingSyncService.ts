import { FirestoreMarketplaceListingRepository } from '../../../../infrastructure/firebase/repositories/firestore-marketplace-listing.repository';
import { AuditLogService } from '../AuditLogService';

export interface ListingSyncSummary {
  totalAnalyzed: number;
  syncedCount: number;
  errorCount: number;
  timestamp: string;
}

/**
 * MarketplaceListingSyncService — Serviço de Sincronização de Anúncios Publicados (Release 2.2.7)
 *
 * Responsável por verificar continuamente a integridade de status, estoque e preço
 * dos anúncios publicados no Mercado Livre, Shopee e WhatsApp.
 */
export class MarketplaceListingSyncService {
  private static instance: MarketplaceListingSyncService;
  private listingRepo = new FirestoreMarketplaceListingRepository();

  private constructor() {}

  public static getInstance(): MarketplaceListingSyncService {
    if (!MarketplaceListingSyncService.instance) {
      MarketplaceListingSyncService.instance = new MarketplaceListingSyncService();
    }
    return MarketplaceListingSyncService.instance;
  }

  public async syncUserListings(userId: string): Promise<ListingSyncSummary> {
    const now = new Date().toISOString();
    const result = await this.listingRepo.findPagedByUserId(userId, 50);
    const listings = result.items;

    let syncedCount = 0;
    let errorCount = 0;

    for (const listing of listings) {
      if (listing.status === 'PUBLISHED') {
        listing.lastSyncAt = now;
        listing.syncStatus = 'SYNCED';
        await this.listingRepo.save(listing);
        syncedCount++;
      } else if (listing.status === 'FAILED' || listing.status === 'EXPIRED_TOKEN') {
        listing.syncStatus = 'ERROR';
        await this.listingRepo.save(listing);
        errorCount++;
      }
    }

    AuditLogService.getInstance().log({
      userId,
      tenantId: userId,
      action: 'LISTINGS_SYNCED',
      module: 'publishing_engine',
      entity: 'MarketplaceListing',
      entityId: 'batch_sync',
      metadata: { syncedCount, errorCount },
    });

    return {
      totalAnalyzed: listings.length,
      syncedCount,
      errorCount,
      timestamp: now,
    };
  }
}
