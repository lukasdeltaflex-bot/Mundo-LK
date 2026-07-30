import { AIStage } from '../AIStage';
import { AIExecutionContext } from '@/core/domain/entities/AIExecutionContext';
import { AILearningEngineService } from '@/core/domain/services/AILearningEngineService';

export class LearningStage implements AIStage {
  public name = 'LearningStage';

  public async execute(context: AIExecutionContext): Promise<void> {
    if (context.flags?.learningEngine) {
      context.hierarchicalContext = await AILearningEngineService.buildHierarchicalContext({
        userId: context.userId,
        marketplaceSlug: context.product.marketplaceSlug,
        categoryId: context.product.categoryId,
      });
    }
  }
}
