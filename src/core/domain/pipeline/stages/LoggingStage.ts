import { AIStage } from '../AIStage';
import { AIExecutionContext } from '@/core/domain/entities/AIExecutionContext';
import { AIAuditLoggerService } from '@/core/domain/services/AIAuditLoggerService';

export class LoggingStage implements AIStage {
  public name = 'LoggingStage';

  public async execute(context: AIExecutionContext): Promise<void> {
    if (context.flags?.costControl && context.analysis) {
      await AIAuditLoggerService.logExecution({
        userId: context.userId,
        productTitle: context.product.title,
        marketplace: context.product.marketplaceSlug,
        style: context.style,
        goal: context.commercialGoal,
        mode: context.generationMode,
        modelUsed: 'gemini-2.5-flash',
        temperature: 0.7,
        durationMs: context.durationMs || 0,
        tokensConsumed: context.cacheHit ? 0 : 450,
        autoRating: context.analysis.autoAvaliacaoNota || 9.5,
        success: true,
        cacheHit: context.cacheHit,
      });
    }
  }
}
