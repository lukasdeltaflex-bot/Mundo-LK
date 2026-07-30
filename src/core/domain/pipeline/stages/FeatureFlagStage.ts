import { AIStage } from '../AIStage';
import { AIExecutionContext } from '@/core/domain/entities/AIExecutionContext';
import { AIFeatureFlagsService } from '@/core/domain/services/AIFeatureFlagsService';

export class FeatureFlagStage implements AIStage {
  public name = 'FeatureFlagStage';

  public async execute(context: AIExecutionContext): Promise<void> {
    context.flags = AIFeatureFlagsService.getFlags();
  }
}
