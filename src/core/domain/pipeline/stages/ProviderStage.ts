import { AIStage } from '../AIStage';
import { AIExecutionContext } from '@/core/domain/entities/AIExecutionContext';
import { AICacheManagerService } from '@/core/domain/services/AICacheManagerService';
import { AIModelSelectorService } from '@/core/domain/services/AIModelSelectorService';
import { GeminiOfferAnalysis, GeminiAIAdapter } from '@/infrastructure/ai/providers/gemini.adapter';

export class ProviderStage implements AIStage {
  public name = 'ProviderStage';

  public async execute(context: AIExecutionContext): Promise<void> {
    const cacheKey = AICacheManagerService.generateCacheKey(
      context.product.id,
      context.style,
      context.commercialGoal,
      context.generationMode,
      context.product.description,
      context.product.categoryId
    );

    const cached = await AICacheManagerService.getCachedAnalysis(cacheKey);
    if (cached) {
      context.analysis = cached;
      context.cacheHit = true;
      return;
    }

    context.cacheHit = false;

    const providerName = context.policy === 'LOW_COST' ? 'deepseek' : 'openai';
    const adapter = AIModelSelectorService.selectProvider(providerName);

    const aiResult = await (adapter as GeminiAIAdapter).generateOfferContent(
      context.product,
      context.style,
      context.commercialGoal,
      context.generationMode,
      context.hierarchicalContext?.winningStrategyPrompt,
      context.prompt
    );

    context.analysis = (aiResult as any).analysis as GeminiOfferAnalysis;

    if (context.analysis) {
      await AICacheManagerService.saveCachedAnalysis(cacheKey, context.analysis);
    }
  }
}
