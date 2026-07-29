import { AffiliateOffer } from '../entities/affiliate-offer.entity';
import { OfferPriceHistory } from '../entities/offer-price-history.entity';
import { MercadoLivreProvider } from '@/infrastructure/marketplaces/providers/MercadoLivreProvider';
import { ShopeeProvider } from '@/infrastructure/marketplaces/providers/ShopeeProvider';
import { IMarketplaceProvider } from '../providers/IMarketplaceProvider';

export interface OpportunityAlert {
  offerId: string;
  productTitle: string;
  previousPrice: number;
  newPrice: number;
  priceDropValue: number;
  priceDropPercentage: number;
  alertMessage: string;
  detectedAt: string;
}

export class OfferMonitorService {
  private static instance: OfferMonitorService;
  private providers: Map<string, IMarketplaceProvider> = new Map();
  private priceHistoryStore: Map<string, OfferPriceHistory[]> = new Map();

  private constructor() {
    this.providers.set('mercadolivre', new MercadoLivreProvider());
    this.providers.set('shopee', new ShopeeProvider());
  }

  public static getInstance(): OfferMonitorService {
    if (!OfferMonitorService.instance) {
      OfferMonitorService.instance = new OfferMonitorService();
    }
    return OfferMonitorService.instance;
  }

  /**
   * Monitora uma oferta individual consultando o marketplace oficial e checando variações de preço.
   */
  public async monitorOffer(offer: AffiliateOffer): Promise<{
    offer: AffiliateOffer;
    priceHistoryItem?: OfferPriceHistory;
    opportunityAlert?: OpportunityAlert;
  }> {
    const provider = this.providers.get(offer.marketplace);
    if (!provider) {
      return { offer };
    }

    try {
      const latestData = await provider.extractOfferData(offer.originalUrl);
      const previousPrice = offer.pricing.currentPrice;
      const latestPrice = latestData.pricing.currentPrice;

      let priceHistoryItem: OfferPriceHistory | undefined;
      let opportunityAlert: OpportunityAlert | undefined;

      // Verifica se houve alteração de preço
      if (latestPrice !== previousPrice && latestPrice > 0) {
        priceHistoryItem = new OfferPriceHistory({
          offerId: offer.id,
          previousPrice,
          newPrice: latestPrice,
          sourceStatus: latestData.pricing.sourceStatus,
        });

        const historyList = this.priceHistoryStore.get(offer.id) || [];
        historyList.push(priceHistoryItem);
        this.priceHistoryStore.set(offer.id, historyList);

        // Atualiza a entidade com o novo preço confirmado
        offer.updatePricing(latestData.pricing);

        // Se houve Queda de Preço, emite o Alerta de Oportunidade
        if (latestPrice < previousPrice) {
          const dropValue = previousPrice - latestPrice;
          const dropPct = Math.round((dropValue / previousPrice) * 100);

          opportunityAlert = {
            offerId: offer.id,
            productTitle: offer.productData.title,
            previousPrice,
            newPrice: latestPrice,
            priceDropValue: dropValue,
            priceDropPercentage: dropPct,
            alertMessage: `🔥 Oportunidade! O preço de "${offer.productData.title}" caiu R$ ${dropValue.toFixed(2)} (${dropPct}% OFF)!`,
            detectedAt: new Date().toISOString(),
          };
        }
      }

      return {
        offer,
        priceHistoryItem,
        opportunityAlert,
      };
    } catch (err) {
      console.warn(`[OfferMonitorService] Erro ao monitorar oferta ${offer.id}:`, err);
      return { offer };
    }
  }

  /**
   * Recupera o histórico de variações de preço de uma oferta.
   */
  public getPriceHistory(offerId: string): OfferPriceHistory[] {
    return this.priceHistoryStore.get(offerId) || [];
  }
}
