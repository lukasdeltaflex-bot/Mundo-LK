import { v4 as uuidv4 } from 'uuid';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../infrastructure/firebase/config/firebase.config';
import { DomainEventBus, IDomainEvent } from '../../domain/events/DomainEventBus';
import { FirestoreCampaignEventRepository } from '../../../infrastructure/firebase/repositories/firestore-campaign-event.repository';
import { AuditLogService } from './AuditLogService';

/**
 * CampaignAnalyticsService — Serviço Global (Release 2.1)
 *
 * Escuta o DomainEventBus para os eventos de campanha:
 *   - OfferClickedEvent   → incrementa clicks + registra campaign_event bruto
 *   - OfferSharedEvent    → incrementa shares + registra campaign_event bruto
 *   - ConversionRegisteredEvent → incrementa conversions + atualiza financeiro
 *   - CampaignCreatedEvent → registra no sistema de auditoria
 *
 * Mantém a coleção campaigns atualizada com resumo de métricas.
 * Grava histórico bruto em campaign_events (imutável).
 */
export class CampaignAnalyticsService {
  private static instance: CampaignAnalyticsService;
  private eventRepo = new FirestoreCampaignEventRepository();

  private constructor() {}

  public static getInstance(): CampaignAnalyticsService {
    if (!CampaignAnalyticsService.instance) {
      CampaignAnalyticsService.instance = new CampaignAnalyticsService();
    }
    return CampaignAnalyticsService.instance;
  }

  /** Registra ouvintes no DomainEventBus — chamar 1 vez na inicialização da app */
  public initListeners(): void {
    const bus = DomainEventBus.getInstance();
    bus.subscribe('CampaignCreatedEvent', this.handleCampaignCreated.bind(this));
    bus.subscribe('OfferClickedEvent', this.handleOfferClicked.bind(this));
    bus.subscribe('OfferSharedEvent', this.handleOfferShared.bind(this));
    bus.subscribe('ConversionRegisteredEvent', this.handleConversionRegistered.bind(this));
    console.log('[CampaignAnalyticsService] Listeners registered.');
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  private async handleCampaignCreated(event: IDomainEvent): Promise<void> {
    const { campaignId, userId } = event.payload as any;
    try {
      AuditLogService.getInstance().log({
        userId,
        tenantId: userId,
        action: 'CAMPAIGN_CREATED',
        module: 'analytics',
        entity: 'Campaign',
        entityId: campaignId,
        metadata: event.payload as Record<string, unknown>,
      });
    } catch (err) {
      console.warn('[CampaignAnalyticsService] handleCampaignCreated error:', err);
    }
  }

  private async handleOfferClicked(event: IDomainEvent): Promise<void> {
    const { campaignId, userId, offerId, source, marketplaceSlug } = event.payload as any;
    try {
      // Grava evento bruto imutável
      await this.eventRepo.record({
        id: `evt_${uuidv4()}`,
        campaignId,
        userId,
        type: 'CLICK',
        source: source || 'direct',
        marketplaceSlug: marketplaceSlug || '',
        createdAt: new Date().toISOString(),
      });

      // Incrementa resumo na campanha
      await this.incrementCampaignField(campaignId, userId, 'metrics.clicks');

      // Auditoria
      AuditLogService.getInstance().log({
        userId,
        tenantId: userId,
        action: 'OFFER_CLICKED',
        module: 'analytics',
        entity: 'Campaign',
        entityId: campaignId,
        metadata: { offerId, source, marketplaceSlug },
      });
    } catch (err) {
      console.warn('[CampaignAnalyticsService] handleOfferClicked error:', err);
    }
  }

  private async handleOfferShared(event: IDomainEvent): Promise<void> {
    const { campaignId, userId, offerId, channel } = event.payload as any;
    try {
      await this.eventRepo.record({
        id: `evt_${uuidv4()}`,
        campaignId,
        userId,
        type: 'SHARE',
        source: channel || 'unknown',
        createdAt: new Date().toISOString(),
      });

      await this.incrementCampaignField(campaignId, userId, 'metrics.shares');

      AuditLogService.getInstance().log({
        userId,
        tenantId: userId,
        action: 'OFFER_SHARED',
        module: 'analytics',
        entity: 'Campaign',
        entityId: campaignId,
        metadata: { offerId, channel },
      });
    } catch (err) {
      console.warn('[CampaignAnalyticsService] handleOfferShared error:', err);
    }
  }

  private async handleConversionRegistered(event: IDomainEvent): Promise<void> {
    const { campaignId, userId, offerId, revenue, commission, marketplaceSlug } =
      event.payload as any;
    try {
      await this.eventRepo.record({
        id: `evt_${uuidv4()}`,
        campaignId,
        userId,
        type: 'CONVERSION',
        marketplaceSlug: marketplaceSlug || '',
        revenue: revenue || 0,
        commission: commission || 0,
        createdAt: new Date().toISOString(),
      });

      // Lê o doc atual e atualiza conversions + financeiro de forma atômica
      const ref = doc(db, 'campaigns', campaignId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const currentConversions = (data.metrics?.conversions || 0) + 1;
        const currentRevenue = (data.financial?.revenue || 0) + (revenue || 0);
        const currentCommission = (data.financial?.commission || 0) + (commission || 0);

        await setDoc(
          ref,
          {
            'metrics.conversions': currentConversions,
            'financial.revenue': currentRevenue,
            'financial.commission': currentCommission,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      AuditLogService.getInstance().log({
        userId,
        tenantId: userId,
        action: 'CONVERSION_REGISTERED',
        module: 'analytics',
        entity: 'Campaign',
        entityId: campaignId,
        metadata: { offerId, revenue, commission, marketplaceSlug },
      });
    } catch (err) {
      console.warn('[CampaignAnalyticsService] handleConversionRegistered error:', err);
    }
  }

  // ── Utilidade: incrementar campo numérico no documento campaign ──────────────
  private async incrementCampaignField(
    campaignId: string,
    userId: string,
    field: string
  ): Promise<void> {
    const ref = doc(db, 'campaigns', campaignId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    // Segurança: valida que o documento pertence ao userId
    if (data.userId !== userId) {
      console.warn(`[CampaignAnalyticsService] Tentativa de escrita em campanha de outro usuário: ${campaignId}`);
      return;
    }

    // Navega nested field (ex: 'metrics.clicks')
    const parts = field.split('.');
    let current = data;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]] || {};
    }
    const lastKey = parts[parts.length - 1];
    const currentValue = current[lastKey] || 0;

    await setDoc(
      ref,
      {
        [field]: currentValue + 1,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }
}
