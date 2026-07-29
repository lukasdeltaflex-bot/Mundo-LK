import { v4 as uuidv4 } from 'uuid';
import { MarketplaceListing, ListingStatus } from '../../../domain/entities/marketplace-listing.entity';
import { MarketplaceConnectionSlug } from '../../../domain/entities/marketplace-connection.entity';
import { IMarketplacePublisher, MarketplacePublishPayload } from '../../../domain/ports/IMarketplacePublisher';
import { MercadoLivrePublisher } from '../../providers/MercadoLivrePublisher';
import { ShopeePublisher } from '../../providers/ShopeePublisher';
import { WhatsAppPublisher } from '../../providers/WhatsAppPublisher';
import { MarketplacePublishValidator } from './MarketplacePublishValidator';
import { FirestoreMarketplaceListingRepository } from '../../../../infrastructure/firebase/repositories/firestore-marketplace-listing.repository';
import { FirestoreMarketplaceListingAttemptRepository } from '../../../../infrastructure/firebase/repositories/firestore-marketplace-listing-attempt.repository';
import { DomainEventBus } from '../../../domain/events/DomainEventBus';
import { PublishRequestedEvent, ListingPublishedEvent, ListingPublishFailedEvent } from '../../../domain/events/ListingEvents';
import { JobQueueService } from '../JobQueueService';
import { AuditLogService } from '../AuditLogService';

/**
 * MarketplaceListingService — Esteira Oficial de Publicação Direta nos Marketplaces (Release 2.2.7)
 *
 * Desacoplado de APIs externas via IMarketplacePublisher.
 * Utiliza o MarketplacePublishValidator para pré-checagem, enfileira execuções no JobQueueService,
 * salva tentativas em marketplace_listing_attempts e atualiza anúncios imutáveis em marketplace_listings.
 */
export class MarketplaceListingService {
  private static instance: MarketplaceListingService;
  private listingRepo = new FirestoreMarketplaceListingRepository();
  private attemptRepo = new FirestoreMarketplaceListingAttemptRepository();
  private publishers: Map<MarketplaceConnectionSlug, IMarketplacePublisher> = new Map();

  private constructor() {
    this.registerPublisher(new MercadoLivrePublisher());
    this.registerPublisher(new ShopeePublisher());
    this.registerPublisher(new WhatsAppPublisher());
  }

  public static getInstance(): MarketplaceListingService {
    if (!MarketplaceListingService.instance) {
      MarketplaceListingService.instance = new MarketplaceListingService();
    }
    return MarketplaceListingService.instance;
  }

  public registerPublisher(publisher: IMarketplacePublisher): void {
    this.publishers.set(publisher.marketplaceSlug, publisher);
  }

  /**
   * Solicita publicação e enfileira Job assíncrono no JobQueueService.
   */
  public async requestPublish(params: {
    userId: string;
    tenantId?: string;
    productId: string;
    offerId: string;
    marketplaceSlug: MarketplaceConnectionSlug;
    payload: MarketplacePublishPayload;
  }): Promise<MarketplaceListing> {
    const now = new Date().toISOString();
    const listingId = `listing_${uuidv4()}`;

    // 1. Pré-Validação
    const validation = MarketplacePublishValidator.validate(params.payload);
    if (!validation.isValid) {
      throw new Error(`Dados inválidos para publicação: ${validation.errors.join(' ')}`);
    }

    const listing = new MarketplaceListing({
      id: listingId,
      userId: params.userId,
      tenantId: params.tenantId || params.userId,
      productId: params.productId,
      offerId: params.offerId,
      marketplaceSlug: params.marketplaceSlug,
      status: 'PUBLISHING',
      syncStatus: 'PENDING',
      price: params.payload.price,
      stock: params.payload.stock,
      createdAt: now,
    });

    await this.listingRepo.save(listing);

    // Evento no DomainEventBus
    DomainEventBus.getInstance().publish(
      new PublishRequestedEvent({
        listingId,
        offerId: params.offerId,
        productId: params.productId,
        userId: params.userId,
        marketplaceSlug: params.marketplaceSlug,
        requestedAt: now,
      })
    );

    // 2. Enfileira Job Assíncrono com Chave de Idempotência
    const executionKey = `pub_${params.offerId}_${params.marketplaceSlug}_${Date.now()}`;
    await JobQueueService.getInstance().enqueue({
      userId: params.userId,
      tenantId: params.tenantId,
      type: 'PUBLISH_MARKETPLACE_LISTING',
      executionKey,
      payload: { listingId, payload: params.payload, marketplaceSlug: params.marketplaceSlug },
    });

    // 3. Processa publicação de forma imediata e resiliente
    return this.executePublish(listing, params.payload);
  }

  /**
   * Executa a chamada de publicação via IMarketplacePublisher e grava a tentativa.
   */
  public async executePublish(listing: MarketplaceListing, payload: MarketplacePublishPayload): Promise<MarketplaceListing> {
    const publisher = this.publishers.get(listing.marketplaceSlug);
    const now = new Date().toISOString();

    if (!publisher) {
      listing.status = 'FAILED';
      listing.errorMessage = `Nenhum provedor de publicação registrado para ${listing.marketplaceSlug}`;
      await this.listingRepo.save(listing);
      return listing;
    }

    try {
      const result = await publisher.publish(payload);

      // Grava histórico de tentativa (MarketplaceListingAttempt)
      await this.attemptRepo.record({
        id: `att_${uuidv4()}`,
        listingId: listing.id,
        userId: listing.userId,
        tenantId: listing.tenantId,
        marketplaceSlug: listing.marketplaceSlug,
        status: result.success ? 'SUCCESS' : 'FAILED',
        requestPayload: payload as unknown as Record<string, unknown>,
        responsePayload: result.rawResponse || {},
        error: result.error || null,
      });

      if (result.success && result.externalId) {
        listing.status = 'PUBLISHED';
        listing.syncStatus = 'SYNCED';
        listing.externalId = result.externalId;
        listing.listingUrl = result.listingUrl;
        listing.publishedAt = now;
        listing.lastSyncAt = now;
        listing.errorMessage = null;

        await this.listingRepo.save(listing);

        DomainEventBus.getInstance().publish(
          new ListingPublishedEvent({
            listingId: listing.id,
            offerId: listing.offerId,
            userId: listing.userId,
            marketplaceSlug: listing.marketplaceSlug,
            externalId: result.externalId,
            listingUrl: result.listingUrl || '',
            publishedAt: now,
          })
        );

        AuditLogService.getInstance().log({
          userId: listing.userId,
          tenantId: listing.tenantId,
          action: 'LISTING_PUBLISHED',
          module: 'publishing_engine',
          entity: 'MarketplaceListing',
          entityId: listing.id,
          metadata: { externalId: result.externalId, marketplaceSlug: listing.marketplaceSlug },
        });
      } else {
        const isTokenErr = result.error?.toLowerCase().includes('token') || result.error?.toLowerCase().includes('unauthorized');
        listing.status = isTokenErr ? 'EXPIRED_TOKEN' : 'FAILED';
        listing.syncStatus = 'ERROR';
        listing.errorMessage = result.error || 'Falha na publicação do anúncio.';
        await this.listingRepo.save(listing);

        DomainEventBus.getInstance().publish(
          new ListingPublishFailedEvent({
            listingId: listing.id,
            offerId: listing.offerId,
            userId: listing.userId,
            marketplaceSlug: listing.marketplaceSlug,
            error: listing.errorMessage,
            failedAt: now,
          })
        );

        AuditLogService.getInstance().log({
          userId: listing.userId,
          tenantId: listing.tenantId,
          action: 'LISTING_PUBLISH_FAILED',
          module: 'publishing_engine',
          entity: 'MarketplaceListing',
          entityId: listing.id,
          metadata: { error: listing.errorMessage, marketplaceSlug: listing.marketplaceSlug },
        });
      }

      return listing;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      listing.status = 'FAILED';
      listing.syncStatus = 'ERROR';
      listing.errorMessage = errorMsg;
      await this.listingRepo.save(listing);
      return listing;
    }
  }
}
