import { Product } from '@/core/domain/entities/product.entity';
import { OfferStyle, CommercialGoal, AIGenerationMode, GeminiOfferAnalysis } from '@/infrastructure/ai/providers/gemini.adapter';
import { AIFeatureFlags } from '@/core/domain/services/AIFeatureFlagsService';
import { AggregatedAIContext } from '@/core/domain/services/AILearningEngineService';
import { ObjectiveQualityMetrics } from '@/core/domain/services/CopySimilarityValidator';
import { AICostEstimate } from '@/core/domain/services/AICostControllerService';

export type AIModelPolicy = 'FAST' | 'QUALITY' | 'LOW_COST' | 'BALANCED';

export interface AIExecutionContext {
  product: Product;
  userId: string;
  style: OfferStyle;
  commercialGoal: CommercialGoal;
  generationMode: AIGenerationMode;
  policy: AIModelPolicy;

  flags?: AIFeatureFlags;
  hierarchicalContext?: AggregatedAIContext;
  prompt?: string;
  promptHash?: string;
  analysis?: GeminiOfferAnalysis;
  objectiveMetrics?: ObjectiveQualityMetrics;
  costEstimate?: AICostEstimate;
  cacheHit?: boolean;
  durationMs?: number;
  errors?: string[];
}
