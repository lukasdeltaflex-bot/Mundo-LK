import { AffiliateOffer } from '../../domain/entities/affiliate-offer.entity';
import {
  AffiliateContentHistory,
  SocialChannel,
  CopyStyle,
  ShareStatus,
} from '../../domain/entities/affiliate-content-history.entity';

export interface WebIntentResult {
  intentUrl: string;
  channel: SocialChannel;
  historySnapshot: AffiliateContentHistory;
}

export class AffiliateDistributionService {
  private static instance: AffiliateDistributionService;
  private historyStore: Map<string, AffiliateContentHistory> = new Map();

  private constructor() {}

  public static getInstance(): AffiliateDistributionService {
    if (!AffiliateDistributionService.instance) {
      AffiliateDistributionService.instance = new AffiliateDistributionService();
    }
    return AffiliateDistributionService.instance;
  }

  /**
   * Constrói o Web Intent oficial para o WhatsApp garantindo a integridade do link de afiliado.
   */
  public createWhatsAppIntent(params: {
    offer: AffiliateOffer;
    copyText: string;
    style?: CopyStyle;
  }): WebIntentResult {
    const { offer, copyText, style = 'aggressive' } = params;

    // Trava de integridade obrigatória
    if (!offer.affiliateLink.verifyIntegrity()) {
      throw new Error('[AffiliateDistributionService] BLOQUEIO DE SEGURANÇA: A integridade do link de afiliado foi violada.');
    }

    const encodedText = encodeURIComponent(copyText);
    const intentUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

    const historySnapshot = new AffiliateContentHistory({
      offerId: offer.id,
      channel: 'whatsapp',
      style,
      copyText,
      affiliateUrlSnapshot: offer.affiliateLink.affiliateUrl,
      priceSnapshot: offer.pricing.currentPrice,
      marketplace: offer.marketplace,
      status: 'SHARED',
    });

    this.historyStore.set(historySnapshot.id, historySnapshot);

    return {
      intentUrl,
      channel: 'whatsapp',
      historySnapshot,
    };
  }

  /**
   * Constrói o Web Intent oficial para o Telegram garantindo a integridade do link de afiliado.
   */
  public createTelegramIntent(params: {
    offer: AffiliateOffer;
    copyText: string;
    style?: CopyStyle;
  }): WebIntentResult {
    const { offer, copyText, style = 'natural' } = params;

    if (!offer.affiliateLink.verifyIntegrity()) {
      throw new Error('[AffiliateDistributionService] BLOQUEIO DE SEGURANÇA: A integridade do link de afiliado foi violada.');
    }

    const encodedUrl = encodeURIComponent(offer.affiliateLink.affiliateUrl);
    const encodedText = encodeURIComponent(copyText);
    const intentUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

    const historySnapshot = new AffiliateContentHistory({
      offerId: offer.id,
      channel: 'telegram',
      style,
      copyText,
      affiliateUrlSnapshot: offer.affiliateLink.affiliateUrl,
      priceSnapshot: offer.pricing.currentPrice,
      marketplace: offer.marketplace,
      status: 'SHARED',
    });

    this.historyStore.set(historySnapshot.id, historySnapshot);

    return {
      intentUrl,
      channel: 'telegram',
      historySnapshot,
    };
  }

  /**
   * Registra uma ação de cópia de texto para a área de transferência.
   */
  public recordCopyAction(params: {
    offer: AffiliateOffer;
    channel: SocialChannel;
    copyText: string;
    style?: CopyStyle;
  }): AffiliateContentHistory {
    const { offer, channel, copyText, style = 'natural' } = params;

    if (!offer.affiliateLink.verifyIntegrity()) {
      throw new Error('[AffiliateDistributionService] BLOQUEIO DE SEGURANÇA: A integridade do link de afiliado foi violada.');
    }

    const historySnapshot = new AffiliateContentHistory({
      offerId: offer.id,
      channel,
      style,
      copyText,
      affiliateUrlSnapshot: offer.affiliateLink.affiliateUrl,
      priceSnapshot: offer.pricing.currentPrice,
      marketplace: offer.marketplace,
      status: 'COPIED',
    });

    this.historyStore.set(historySnapshot.id, historySnapshot);
    return historySnapshot;
  }

  /**
   * Recupera o histórico de snapshots de conteúdo de uma oferta.
   */
  public getOfferHistory(offerId: string): AffiliateContentHistory[] {
    return Array.from(this.historyStore.values()).filter((h) => h.offerId === offerId);
  }
}
