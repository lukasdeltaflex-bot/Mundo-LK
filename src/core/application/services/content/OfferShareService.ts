import { AuditLogService } from '../AuditLogService';

export interface ShareOfferInput {
  userId: string;
  tenantId?: string;
  offerId: string;
  title: string;
  price: number;
  affiliateUrl: string;
  formattedText: string;
  channel: 'whatsapp' | 'telegram' | 'facebook' | 'instagram' | 'copy_text' | 'copy_link';
}

/**
 * OfferShareService — Centro Permanente de Compartilhamento de Ofertas (Release 2.2.8.1)
 *
 * Responsável por gerenciar disparos para canais sociais, cópia de texto formatado com UTF-8 limpo,
 * preservação da URL de afiliado e auditoria permanente.
 */
export class OfferShareService {
  private static instance: OfferShareService;

  private constructor() {}

  public static getInstance(): OfferShareService {
    if (!OfferShareService.instance) {
      OfferShareService.instance = new OfferShareService();
    }
    return OfferShareService.instance;
  }

  public async copyText(text: string, userId?: string, offerId?: string): Promise<boolean> {
    const cleanText = text.replace(/\uFFFD/g, '').trim();
    if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(cleanText);

      if (userId && offerId) {
        AuditLogService.getInstance().log({
          userId,
          tenantId: userId,
          action: 'CONTENT_COPIED',
          module: 'share_center',
          entity: 'Offer',
          entityId: offerId,
          metadata: { type: 'text' },
        });
      }
      return true;
    }
    return false;
  }

  public async copyLink(url: string, userId?: string, offerId?: string): Promise<boolean> {
    const cleanUrl = url.trim();
    if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(cleanUrl);

      if (userId && offerId) {
        AuditLogService.getInstance().log({
          userId,
          tenantId: userId,
          action: 'CONTENT_COPIED',
          module: 'share_center',
          entity: 'Offer',
          entityId: offerId,
          metadata: { type: 'link', affiliateUrl: cleanUrl },
        });
      }
      return true;
    }
    return false;
  }

  public shareToWhatsApp(input: ShareOfferInput): void {
    const encodedText = encodeURIComponent(input.formattedText.replace(/\uFFFD/g, ''));
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }

    AuditLogService.getInstance().log({
      userId: input.userId,
      tenantId: input.tenantId || input.userId,
      action: 'CONTENT_SHARED',
      module: 'share_center',
      entity: 'Offer',
      entityId: input.offerId,
      metadata: { channel: 'whatsapp' },
    });
  }

  public shareToTelegram(input: ShareOfferInput): void {
    const encodedText = encodeURIComponent(input.formattedText.replace(/\uFFFD/g, ''));
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(input.affiliateUrl)}&text=${encodedText}`;
    if (typeof window !== 'undefined') {
      window.open(tgUrl, '_blank');
    }

    AuditLogService.getInstance().log({
      userId: input.userId,
      tenantId: input.tenantId || input.userId,
      action: 'CONTENT_SHARED',
      module: 'share_center',
      entity: 'Offer',
      entityId: input.offerId,
      metadata: { channel: 'telegram' },
    });
  }
}
