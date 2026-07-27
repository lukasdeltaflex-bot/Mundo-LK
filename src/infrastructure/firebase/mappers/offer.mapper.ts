import { Offer } from '../../../core/domain/entities/offer.entity';
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
}

export class OfferMapper {
  public static toDomain(doc: FirestoreOfferDoc): Offer {
    const copies = ChannelContent.create({
      shortText: doc.copies.shortText || '',
      mediumText: doc.copies.mediumText || '',
      longText: doc.copies.longText || '',
      whatsAppText: doc.copies.whatsAppText || '',
      telegramText: doc.copies.telegramText || '',
      instagramText: doc.copies.instagramText || '',
      facebookText: doc.copies.facebookText || '',
      threadsText: doc.copies.threadsText || '',
      pinterestText: doc.copies.pinterestText || '',
      tikTokText: doc.copies.tikTokText || '',
      storyText: doc.copies.storyText || '',
      channelText: doc.copies.channelText || '',
    });

    return new Offer({
      id: doc.id,
      productId: doc.productId,
      userId: doc.userId,
      scoreValue: doc.scoreValue,
      scoreLabel: doc.scoreLabel,
      scoreJustification: doc.scoreJustification,
      copies,
      hashtags: doc.hashtags || [],
      emojis: doc.emojis || [],
      cta: doc.cta,
      aiProviderUsed: doc.aiProviderUsed,
      createdAt: new Date(doc.createdAt),
    });
  }

  public static toPersistence(entity: Offer): FirestoreOfferDoc {
    return {
      id: entity.id,
      productId: entity.productId,
      userId: entity.userId,
      scoreValue: entity.scoreValue,
      scoreLabel: entity.scoreLabel,
      scoreJustification: entity.scoreJustification,
      copies: { ...entity.copies.copies },
      hashtags: entity.hashtags,
      emojis: entity.emojis,
      cta: entity.cta,
      aiProviderUsed: entity.aiProviderUsed,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
