import { DomainEventBus } from '@/core/domain/events/DomainEventBus';
import { AuditLog } from '@/core/domain/entities/audit-log.entity';
import { FirestoreAuditLogRepository } from '@/infrastructure/firebase/repositories/firestore-audit-log.repository';

export class AuditLogService {
  private static instance: AuditLogService;
  private repo = new FirestoreAuditLogRepository();
  private initialized = false;

  private constructor() {}

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  /**
   * Subscribes to domain events to generate immutable system logs.
   */
  public initListeners(): void {
    if (this.initialized) return;
    this.initialized = true;

    const eventBus = DomainEventBus.getInstance();

    eventBus.subscribe('OfferCreatedEvent', async (event) => {
      const payload = event.payload as any;
      const userId = payload?.offer?.userId || payload?.userId || 'user_default';
      const offerId = payload?.offer?.id || payload?.offerId || 'offer_unknown';

      await this.logEvent({
        userId,
        tenantId: userId,
        action: 'OFFER_CREATED',
        module: 'OFFER_MANAGEMENT',
        entity: 'Offer',
        entityId: offerId,
        metadata: {
          timestamp: event.timestamp || new Date().toISOString(),
        },
      });
    });
  }

  /**
   * Manually record a domain audit log.
   */
  public async logEvent(params: {
    userId: string;
    tenantId?: string;
    action: string;
    module: string;
    entity: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const log = new AuditLog({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: params.userId,
      tenantId: params.tenantId || params.userId,
      action: params.action,
      module: params.module,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata,
      timestamp: new Date().toISOString(),
    });

    await this.repo.save(log);
  }

  /**
   * Alias conveniente para logEvent — aceita os mesmos parâmetros.
   */
  public log(params: {
    userId: string;
    tenantId?: string;
    action: string;
    module: string;
    entity: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): void {
    // Fire-and-forget com captura de erro silenciosa para não bloquear o fluxo
    this.logEvent(params).catch((err) =>
      console.warn('[AuditLogService] log() silenced error:', err)
    );
  }
}
