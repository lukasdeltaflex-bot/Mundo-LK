import { AIStage } from '../AIStage';
import { AIExecutionContext } from '@/core/domain/entities/AIExecutionContext';
import { AIResponseValidatorService } from '@/core/domain/services/AIResponseValidatorService';
import { CopySimilarityValidator } from '@/core/domain/services/CopySimilarityValidator';

export class ValidationStage implements AIStage {
  public name = 'ValidationStage';

  public async execute(context: AIExecutionContext): Promise<void> {
    if (!context.analysis) return;

    const validation = AIResponseValidatorService.validateResponse(
      context.analysis,
      context.product.affiliateUrl?.url || ''
    );

    context.analysis = validation.sanitizedAnalysis;
    context.objectiveMetrics = CopySimilarityValidator.calculateObjectiveMetrics(
      context.analysis.whatsAppText,
      context.analysis.cta
    );
  }
}
