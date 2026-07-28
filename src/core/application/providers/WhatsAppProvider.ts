import {
  INotificationProvider,
  SendNotificationParams,
  SendNotificationResult,
} from '../../domain/ports/INotificationProvider';
import { AuditLogService } from '../services/AuditLogService';

/**
 * WhatsAppProvider — Provedor Isolado para WhatsApp Cloud API (Release 2.2.3)
 *
 * Módulo desacoplado de notificação.
 * Possui degradação graciosa: se as credenciais da Meta (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID)
 * não estiverem presentes nas variáveis de ambiente, retorna aviso amigável sem interromper a aplicação.
 */
export class WhatsAppProvider implements INotificationProvider {
  public readonly name = 'WhatsApp Cloud API';

  private get token(): string | undefined {
    return process.env.WHATSAPP_TOKEN || process.env.NEXT_PUBLIC_WHATSAPP_TOKEN;
  }

  private get phoneNumberId(): string | undefined {
    return process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;
  }

  public isConfigured(): boolean {
    return Boolean(this.token && this.phoneNumberId);
  }

  public async send(params: SendNotificationParams): Promise<SendNotificationResult> {
    if (!this.isConfigured()) {
      console.info('[WhatsAppProvider] Integração WhatsApp Cloud API não configurada (tokens ausentes).');
      return {
        success: false,
        error: 'Integração WhatsApp não configurada nas variáveis de ambiente.',
      };
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: params.recipient,
          type: 'text',
          text: { body: params.message },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || response.statusText;
        console.warn('[WhatsAppProvider] Erro no disparo da Meta API:', errorMsg);
        return { success: false, error: errorMsg };
      }

      const messageId = data?.messages?.[0]?.id || `wa_${Date.now()}`;

      AuditLogService.getInstance().log({
        userId: 'system',
        tenantId: 'system',
        action: 'WHATSAPP_MESSAGE_SENT',
        module: 'notification',
        entity: 'WhatsAppProvider',
        entityId: messageId,
        metadata: { recipient: params.recipient },
      });

      return { success: true, messageId };
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      console.warn('[WhatsAppProvider] Exceção na chamada de rede:', errorMsg);
      return { success: false, error: errorMsg };
    }
  }
}
