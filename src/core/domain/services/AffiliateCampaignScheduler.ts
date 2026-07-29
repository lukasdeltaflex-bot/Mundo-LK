import { AffiliateCampaign } from '../entities/affiliate-campaign.entity';
import { AffiliateOffer } from '../entities/affiliate-offer.entity';
import { JobQueueService } from '../../application/services/JobQueueService';
import { AffiliateDistributionService } from '../../application/services/AffiliateDistributionService';

export class AffiliateCampaignScheduler {
  private static instance: AffiliateCampaignScheduler;
  private campaignsStore: Map<string, AffiliateCampaign> = new Map();
  private queueService = JobQueueService.getInstance();
  private distributionService = AffiliateDistributionService.getInstance();

  private constructor() {}

  public static getInstance(): AffiliateCampaignScheduler {
    if (!AffiliateCampaignScheduler.instance) {
      AffiliateCampaignScheduler.instance = new AffiliateCampaignScheduler();
    }
    return AffiliateCampaignScheduler.instance;
  }

  /**
   * Agenda uma campanha com estado SCHEDULED e enfileira no JobQueue.
   */
  public async schedule(campaign: AffiliateCampaign, scheduledAt: string): Promise<AffiliateCampaign> {
    campaign.schedule(scheduledAt);
    this.campaignsStore.set(campaign.id, campaign);

    // Enfileira o job de agendamento garantindo idempotência
    await this.queueService.enqueue({
      userId: campaign.userId,
      tenantId: campaign.tenantId,
      type: 'SEND_WHATSAPP', // Reutiliza tipo nativo de fila assíncrona
      executionKey: `cmp_exec_${campaign.id}`,
      payload: {
        campaignId: campaign.id,
        offerId: campaign.offerId,
        scheduledAt,
      },
    });

    return campaign;
  }

  /**
   * Executa uma campanha agendada registrando as ações de compartilhamento e alterando o estado para EXECUTED.
   */
  public execute(campaign: AffiliateCampaign, offer: AffiliateOffer): AffiliateCampaign {
    if (!offer.affiliateLink.verifyIntegrity()) {
      throw new Error('[AffiliateCampaignScheduler] ERRO DE SEGURANÇA: A integridade do link de afiliado está corrompida.');
    }

    // Registra os snapshots de distribuição para cada canal configurado na campanha
    if (campaign.channels.includes('whatsapp') && campaign.copies.whatsapp) {
      this.distributionService.createWhatsAppIntent({
        offer,
        copyText: campaign.copies.whatsapp,
      });
    }

    if (campaign.channels.includes('telegram') && campaign.copies.telegram) {
      this.distributionService.createTelegramIntent({
        offer,
        copyText: campaign.copies.telegram,
      });
    }

    campaign.markAsExecuted();
    this.campaignsStore.set(campaign.id, campaign);

    return campaign;
  }

  public getCampaign(id: string): AffiliateCampaign | undefined {
    return this.campaignsStore.get(id);
  }

  public getUserCampaigns(userId: string): AffiliateCampaign[] {
    return Array.from(this.campaignsStore.values()).filter((c) => c.userId === userId);
  }
}
