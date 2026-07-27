import { ChannelContent } from '../value-objects/channel-content.vo';
import { ScoreType } from '../value-objects/score-level.vo';

export interface OfferProps {
  id: string;
  productId: string;
  userId: string;
  scoreValue: number;
  scoreLabel: ScoreType;
  scoreJustification: string;
  copies: ChannelContent;
  hashtags: string[];
  emojis: string[];
  cta: string;
  aiProviderUsed: string;
  createdAt: Date;
}

/**
 * Pure Domain Entity representing an AI Generated Offer.
 */
export class Offer {
  public readonly id: string;
  public readonly productId: string;
  public readonly userId: string;
  public readonly scoreValue: number;
  public readonly scoreLabel: ScoreType;
  public readonly scoreJustification: string;
  public readonly copies: ChannelContent;
  public readonly hashtags: string[];
  public readonly emojis: string[];
  public readonly cta: string;
  public readonly aiProviderUsed: string;
  public readonly createdAt: Date;

  constructor(props: OfferProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.userId = props.userId;
    this.scoreValue = props.scoreValue;
    this.scoreLabel = props.scoreLabel;
    this.scoreJustification = props.scoreJustification;
    this.copies = props.copies;
    this.hashtags = props.hashtags;
    this.emojis = props.emojis;
    this.cta = props.cta;
    this.aiProviderUsed = props.aiProviderUsed;
    this.createdAt = props.createdAt;
  }
}
