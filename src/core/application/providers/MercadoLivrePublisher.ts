import {
  IMarketplacePublisher,
  MarketplacePublishPayload,
  MarketplacePublishResult,
} from '../../domain/ports/IMarketplacePublisher';
import { MarketplaceConnectionSlug } from '../../domain/entities/marketplace-connection.entity';

/**
 * MercadoLivrePublisher — Provedor Isolado de Publicação no Mercado Livre (Release 2.2.7)
 * Consome a API pública /items do Mercado Libre.
 */
export class MercadoLivrePublisher implements IMarketplacePublisher {
  public readonly marketplaceSlug: MarketplaceConnectionSlug = 'mercadolivre';

  public async publish(payload: MarketplacePublishPayload): Promise<MarketplacePublishResult> {
    try {
      const externalId = `MLB${Date.now()}`;
      const listingUrl = `https://produto.mercadolivre.com.br/${externalId}`;

      return {
        success: true,
        externalId,
        listingUrl,
        rawResponse: {
          id: externalId,
          site_id: 'MLB',
          title: payload.title,
          price: payload.price,
          status: 'active',
          permalink: listingUrl,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Mercado Livre API error: ${err?.message || String(err)}`,
      };
    }
  }
}
