import { AffiliateOffer } from '../../domain/entities/affiliate-offer.entity';
import { AffiliateOpportunityScore } from '../../domain/services/AffiliateOpportunityScore';
import { OfferMonitorService, OpportunityAlert } from '../../domain/services/OfferMonitorService';
import { AffiliateCampaign } from '../../domain/entities/affiliate-campaign.entity';
import { AffiliateAIOrchestrator } from '../../domain/services/AffiliateAIOrchestrator';

export interface DailyBriefingResult {
  greetingMessage: string;
  priceDropAlerts: OpportunityAlert[];
  highOpportunityOffers: AffiliateOffer[];
  draftCampaignsToApprove: AffiliateCampaign[];
  topOpportunityOffer: AffiliateOffer | null;
  generatedAt: string;
}

export class DailyAffiliateAssistant {
  private static instance: DailyAffiliateAssistant;
  private monitorService = OfferMonitorService.getInstance();
  private aiOrchestrator = AffiliateAIOrchestrator.getInstance();

  private constructor() {}

  public static getInstance(): DailyAffiliateAssistant {
    if (!DailyAffiliateAssistant.instance) {
      DailyAffiliateAssistant.instance = new DailyAffiliateAssistant();
    }
    return DailyAffiliateAssistant.instance;
  }

  /**
   * Gera o briefing matinal acionável baseado exclusivamente em evidências reais.
   */
  public async generateDailyBriefing(userId: string, offers: AffiliateOffer[]): Promise<DailyBriefingResult> {
    const activeOffers = offers.filter((o) => o.status === 'ACTIVE');
    const priceDropAlerts: OpportunityAlert[] = [];
    const highOpportunityOffers: AffiliateOffer[] = [];
    const draftCampaignsToApprove: AffiliateCampaign[] = [];

    let topScore = -1;
    let topOpportunityOffer: AffiliateOffer | null = null;

    for (const offer of activeOffers) {
      // 1. Re-analisa preços com o Monitor
      const monRes = await this.monitorService.monitorOffer(offer);
      if (monRes.opportunityAlert) {
        priceDropAlerts.push(monRes.opportunityAlert);

        // Gera automaticamente uma rascunho de campanha para aprovação em 1-clique
        try {
          const content = this.aiOrchestrator.generateMultiChannelContent(offer);
          const autoCampaign = new AffiliateCampaign({
            userId,
            offerId: offer.id,
            name: `Campanha Queda de Preço - ${offer.productData.title}`,
            campaignType: 'PRICE_DROP',
            channels: ['whatsapp', 'telegram', 'instagram'],
            copies: {
              whatsapp: content.whatsappCopy || undefined,
              instagram: content.instagramCaption || undefined,
            },
            status: 'DRAFT',
          });
          draftCampaignsToApprove.push(autoCampaign);
        } catch (e) {
          console.warn('[DailyAffiliateAssistant] Erro ao criar rascunho automático de campanha:', e);
        }
      }

      // 2. Calcula Score de Oportunidade
      const scoreRes = AffiliateOpportunityScore.calculate(offer);
      if (scoreRes.tier === 'HIGH') {
        highOpportunityOffers.push(offer);
      }

      if (scoreRes.totalScore > topScore) {
        topScore = scoreRes.totalScore;
        topOpportunityOffer = offer;
      }
    }

    const greetingMessage = `Bom dia! Hoje temos ${priceDropAlerts.length} ofertas com queda de preço detectada, ${highOpportunityOffers.length} oportunidades de pontuação alta e ${draftCampaignsToApprove.length} campanhas rascunho prontas para aprovação.`;

    return {
      greetingMessage,
      priceDropAlerts,
      highOpportunityOffers,
      draftCampaignsToApprove,
      topOpportunityOffer,
      generatedAt: new Date().toISOString(),
    };
  }
}
