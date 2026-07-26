export interface ChannelCopies {
  shortText: string;
  mediumText: string;
  longText: string;
  whatsAppText: string;
  telegramText: string;
  instagramText: string;
  facebookText: string;
  threadsText: string;
  pinterestText: string;
  tikTokText: string;
  storyText: string;
  channelText: string;
}

/**
 * Value Object encapsulating generated copies across all social/messaging channels.
 */
export class ChannelContent {
  public readonly copies: ChannelCopies;

  constructor(copies: Partial<ChannelCopies>) {
    this.copies = {
      shortText: copies.shortText || '',
      mediumText: copies.mediumText || '',
      longText: copies.longText || '',
      whatsAppText: copies.whatsAppText || '',
      telegramText: copies.telegramText || '',
      instagramText: copies.instagramText || '',
      facebookText: copies.facebookText || '',
      threadsText: copies.threadsText || '',
      pinterestText: copies.pinterestText || '',
      tikTokText: copies.tikTokText || '',
      storyText: copies.storyText || '',
      channelText: copies.channelText || '',
    };
  }

  public static create(copies: Partial<ChannelCopies>): ChannelContent {
    return new ChannelContent(copies);
  }
}
