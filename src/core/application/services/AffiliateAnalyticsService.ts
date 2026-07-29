import { AffiliateOffer } from '../../domain/entities/affiliate-offer.entity';
import { AffiliateDistributionService } from './AffiliateDistributionService';
import { AffiliateOpportunityScore } from '../../domain/services/AffiliateOpportunityScore';

export interface ChannelShareMetrics {
  whatsappCount: number;
  telegramCount: number;
  instagramCount: number;
  tiktokCount: number;
  totalShares: number;
}

export interface AffiliateMetricsResult {
  activeOffersCount: number;
  highOpportunityOffersCount: number;
  contentVariationsCount: number;
  sharesByChannel: ChannelShareMetrics;
  evaluatedAt: string;
}

export class AffiliateAnalyticsService {
  private static instance: AffiliateAnalyticsService;
  private distributionService = AffiliateDistributionService.getInstance();

  private constructor() {}

  public static getInstance(): AffiliateAnalyticsService {
    if (!AffiliateAnalyticsService.instance) {
      AffiliateAnalyticsService.instance = new AffiliateAnalyticsService();
    }
    return AffiliateAnalyticsService.instance;
  }

  /**
   * Consolida métricas operacionais confirmadas sem estimativas ou dados fictícios.
   */
  public calculateMetrics(offers: AffiliateOffer[]): AffiliateMetricsResult {
    const activeOffers = offers.filter((o) => o.status === 'ACTIVE');

    let highOpportunityOffersCount = 0;
    let contentVariationsCount = 0;

    let whatsappCount = 0;
    let telegramCount = 0;
    let instagramCount = 0;
    let tiktokCount = 0;

    for (const offer of activeOffers) {
      const score = AffiliateOpportunityScore.calculate(offer);
      if (score.tier === 'HIGH') {
        highOpportunityOffersCount++;
      }

      const history = this.distributionService.getOfferHistory(offer.id);
      contentVariationsCount += history.length;

      for (const h of history) {
        if (h.channel === 'whatsapp') whatsappCount++;
        if (h.channel === 'telegram') telegramCount++;
        if (h.channel === 'instagram') instagramCount++;
        if (h.channel === 'tiktok') tiktokCount++;
      }
    }

    const totalShares = whatsappCount + telegramCount + instagramCount + tiktokCount;

    return {
      activeOffersCount: activeOffers.length,
      highOpportunityOffersCount,
      contentVariationsCount,
      sharesByChannel: {
        whatsappCount,
        telegramCount,
        instagramCount,
        tiktokCount,
        totalShares,
      },
      evaluatedAt: new Date().toISOString(),
    };
  }
}
