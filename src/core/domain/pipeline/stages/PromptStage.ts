import { AIStage } from '../AIStage';
import { AIExecutionContext } from '@/core/domain/entities/AIExecutionContext';
import { PromptOptimizerService } from '@/core/domain/services/PromptOptimizerService';

export class PromptStage implements AIStage {
  public name = 'PromptStage';

  public async execute(context: AIExecutionContext): Promise<void> {
    const rawBlock = context.hierarchicalContext?.fullHierarchicalPromptBlock || '';
    const { finalPrompt, promptHash } = PromptOptimizerService.optimizePrompt(rawBlock, 'few-shot');
    context.prompt = finalPrompt;
    context.promptHash = promptHash;
  }
}
