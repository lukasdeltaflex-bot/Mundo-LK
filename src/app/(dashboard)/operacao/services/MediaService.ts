export interface MediaItem {
  id: string;
  offerId: string;
  type: 'feed_1x1' | 'story_9x16' | 'banner_horizontal' | 'pinterest_pin' | 'whatsapp_card';
  url: string;
  status: 'READY' | 'GENERATING';
  dimensions: string;
  createdAt: string;
}

export class MediaService {
  /**
   * Generates media structures linked to the specific Offer entity (not Product).
   */
  public generateMediaForOffer(
    offerId: string,
    productTitle: string,
    productImage?: string,
    currentPrice?: number | null
  ): MediaItem[] {
    const now = new Date().toISOString();
    const baseImg = productImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500';

    return [
      {
        id: `media_feed_${offerId}_1`,
        offerId,
        type: 'feed_1x1',
        url: baseImg,
        status: 'READY',
        dimensions: '1080 x 1080',
        createdAt: now,
      },
      {
        id: `media_story_${offerId}_2`,
        offerId,
        type: 'story_9x16',
        url: baseImg,
        status: 'READY',
        dimensions: '1080 x 1920',
        createdAt: now,
      },
      {
        id: `media_banner_${offerId}_3`,
        offerId,
        type: 'banner_horizontal',
        url: baseImg,
        status: 'READY',
        dimensions: '1200 x 628',
        createdAt: now,
      },
      {
        id: `media_pin_${offerId}_4`,
        offerId,
        type: 'pinterest_pin',
        url: baseImg,
        status: 'READY',
        dimensions: '1000 x 1500',
        createdAt: now,
      },
      {
        id: `media_card_${offerId}_5`,
        offerId,
        type: 'whatsapp_card',
        url: baseImg,
        status: 'READY',
        dimensions: '800 x 800',
        createdAt: now,
      },
    ];
  }
}
