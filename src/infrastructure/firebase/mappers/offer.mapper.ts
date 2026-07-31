import { Offer, MarketplaceDetectionSource } from '../../../core/domain/entities/offer.entity';
import { ChannelContent } from '../../../core/domain/value-objects/channel-content.vo';

export interface FirestoreOfferDoc {
  id: string;
  productId: string;
  userId: string;
  scoreValue: number;
  scoreLabel: 'EXCELLENT' | 'GOOD' | 'REGULAR';
  scoreJustification: string;
  copies: Record<string, string>;
  hashtags: string[];
  emojis: string[];
  cta: string;
  aiProviderUsed: string;
  createdAt: string;
  // ── Marketplace Intelligence (Fase 2.5) ─────────────────────────────────
  marketplaceId?: string;
  marketplaceName?: string;
  marketplaceDetectedBy?: MarketplaceDetectionSource;
}

export class OfferMapper {
  public static toDomain(doc: FirestoreOfferDoc): Offer {
    const rawCopies = doc.copies || {};
    const rootDoc = doc as any;

    const whatsAppText =
      rawCopies.whatsAppText ||
      rawCopies.whatsappText ||
      rootDoc.whatsAppText ||
      rootDoc.whatsappText ||
      '';

    const telegramText =
      rawCopies.telegramText ||
      rootDoc.telegramText ||
      whatsAppText;

    const instagramText =
      rawCopies.instagramText ||
      rootDoc.instagramText ||
      whatsAppText;

    const facebookText =
      rawCopies.facebookText ||
      rootDoc.facebookText ||
      whatsAppText;

    const copies = ChannelContent.create({
      shortText: rawCopies.shortText || rootDoc.shortText || '',
      mediumText: rawCopies.mediumText || rootDoc.mediumText || '',
      longText: rawCopies.longText || rootDoc.longText || '',
      whatsAppText,
      telegramText,
      instagramText,
      facebookText,
      threadsText: rawCopies.threadsText || rootDoc.threadsText || '',
      pinterestText: rawCopies.pinterestText || rootDoc.pinterestText || '',
      tikTokText: rawCopies.tikTokText || rootDoc.tikTokText || '',
      storyText: rawCopies.storyText || rootDoc.storyText || '',
      channelText: rawCopies.channelText || rootDoc.channelText || whatsAppText,
    });

    return new Offer({
      id: doc.id,
      productId: doc.productId,
      userId: doc.userId,
      scoreValue: doc.scoreValue || 90,
      scoreLabel: doc.scoreLabel || 'GOOD',
      scoreJustification: doc.scoreJustification || '',
      copies,
      hashtags: doc.hashtags || [],
      emojis: doc.emojis || [],
      cta: doc.cta || rootDoc.cta || '',
      aiProviderUsed: doc.aiProviderUsed || 'gemini-2.5-flash',
      createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      // ── Marketplace Intelligence (Fase 2.5) ────────────────────────────
      marketplaceId: doc.marketplaceId || rootDoc.marketplaceSlug || undefined,
      marketplaceName: doc.marketplaceName || undefined,
      marketplaceDetectedBy: (doc.marketplaceDetectedBy as MarketplaceDetectionSource) || 'url_parser',
    });
  }

  public static toPersistence(entity: Offer): FirestoreOfferDoc {
    const copiesMap = { ...entity.copies.copies };
    return {
      id: entity.id,
      productId: entity.productId,
      userId: entity.userId,
      scoreValue: entity.scoreValue,
      scoreLabel: entity.scoreLabel,
      scoreJustification: entity.scoreJustification,
      copies: copiesMap,
      // Espelhar copies na raiz do doc para compatibilidade retroativa
      whatsAppText: copiesMap.whatsAppText,
      whatsappText: copiesMap.whatsAppText,
      telegramText: copiesMap.telegramText,
      instagramText: copiesMap.instagramText,
      facebookText: copiesMap.facebookText,
      hashtags: entity.hashtags,
      emojis: entity.emojis,
      cta: entity.cta,
      aiProviderUsed: entity.aiProviderUsed,
      createdAt: entity.createdAt.toISOString(),
      // ── Marketplace Intelligence (Fase 2.5) ────────────────────────────
      ...(entity.marketplaceId && { marketplaceId: entity.marketplaceId }),
      ...(entity.marketplaceName && { marketplaceName: entity.marketplaceName }),
      ...(entity.marketplaceDetectedBy && { marketplaceDetectedBy: entity.marketplaceDetectedBy }),
    } as any;
  }
}
