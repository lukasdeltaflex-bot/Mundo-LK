import { AIExecutionContext } from '@/core/domain/entities/AIExecutionContext';

export interface AIStage {
  name: string;
  execute(context: AIExecutionContext): Promise<void>;
}
