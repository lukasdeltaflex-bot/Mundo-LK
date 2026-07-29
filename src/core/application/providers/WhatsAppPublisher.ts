import {
  IMarketplacePublisher,
  MarketplacePublishPayload,
  MarketplacePublishResult,
} from '../../domain/ports/IMarketplacePublisher';
import { MarketplaceConnectionSlug } from '../../domain/entities/marketplace-connection.entity';
import { WhatsAppProvider } from './WhatsAppProvider';

/**
 * WhatsAppPublisher — Provedor Isolado de Publicação de Oferta no WhatsApp (Release 2.2.7)
 * Delega o disparo para o WhatsAppProvider via Meta Graph API.
 */
export class WhatsAppPublisher implements IMarketplacePublisher {
  public readonly marketplaceSlug: MarketplaceConnectionSlug = 'whatsapp';
  private waProvider = new WhatsAppProvider();

  public async publish(payload: MarketplacePublishPayload): Promise<MarketplacePublishResult> {
    try {
      const messageText = `🔥 *${payload.title}*\n\n💰 Por apenas R$ ${payload.price.toFixed(2)}\n\n👉 Confira aqui: ${payload.affiliateUrl}`;

      const res = await this.waProvider.send({
        recipient: 'system_broadcast',
        message: messageText,
        payload: { title: payload.title, price: payload.price },
      });

      if (!res.success) {
        return { success: false, error: res.error };
      }

      const externalId = res.messageId || `WA_MSG_${Date.now()}`;
      return {
        success: true,
        externalId,
        listingUrl: payload.affiliateUrl,
        rawResponse: { messageId: externalId, status: 'sent' },
      };
    } catch (err: any) {
      return {
        success: false,
        error: `WhatsApp Cloud API error: ${err?.message || String(err)}`,
      };
    }
  }
}
