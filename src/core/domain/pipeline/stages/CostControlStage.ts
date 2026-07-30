import { AIStage } from '../AIStage';
import { AIExecutionContext } from '@/core/domain/entities/AIExecutionContext';
import { AICostControllerService } from '@/core/domain/services/AICostControllerService';

export class CostControlStage implements AIStage {
  public name = 'CostControlStage';

  public async execute(context: AIExecutionContext): Promise<void> {
    if (context.prompt) {
      context.costEstimate = AICostControllerService.estimateCost(context.prompt);
      context.prompt = AICostControllerService.enforceBudgetGuardrails(context.prompt);
    }
  }
}
