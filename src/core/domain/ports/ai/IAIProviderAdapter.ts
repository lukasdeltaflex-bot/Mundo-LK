import { ChannelContent } from '../../value-objects/channel-content.vo';
import { AICost } from '../../value-objects/ai-cost.vo';
import { Product } from '../../entities/product.entity';
import { Score } from '../../entities/score.entity';

export interface AIOfferGenerationResult {
  copies: ChannelContent;
  hashtags: string[];
  emojis: string[];
  cta: string;
  score: Score;
  cost: AICost;
}

export interface IAIProviderAdapter {
  readonly providerName: string;
  generateOfferContent(product: Product): Promise<AIOfferGenerationResult>;
}
