import { ChannelContent } from '../value-objects/channel-content.vo';
import { ScoreType } from '../value-objects/score-level.vo';
import { ProductMedia } from './product.entity';

export type MarketplaceDetectionSource = 'url_parser' | 'manual_selection' | 'api_response' | 'unknown';

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
  // ── Marketplace Intelligence (Fase 2.5) ─────────────────────────────────
  marketplaceId?: string;              // ex: "shopee", "amazon", "mercadolivre"
  marketplaceName?: string;            // ex: "Shopee", "Amazon"
  marketplaceDetectedBy?: MarketplaceDetectionSource; // rastreabilidade da detecção
  media?: ProductMedia[];              // Mídias (imagens/vídeos) específicas desta oferta
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
  // ── Marketplace Intelligence (Fase 2.5) ─────────────────────────────────
  public readonly marketplaceId?: string;
  public readonly marketplaceName?: string;
  public readonly marketplaceDetectedBy?: MarketplaceDetectionSource;
  public readonly media?: ProductMedia[];

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
    this.marketplaceId = props.marketplaceId;
    this.marketplaceName = props.marketplaceName;
    this.marketplaceDetectedBy = props.marketplaceDetectedBy;
    this.media = props.media;
  }
}
