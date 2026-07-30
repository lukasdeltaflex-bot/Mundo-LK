import { AIStage } from './AIStage';
import { PipelineRegistry } from './PipelineRegistry';

export type PipelineWorkflowMode = 'COPY_GENERATION' | 'PRODUCT_ANALYSIS' | 'SEO_ANALYSIS' | string;

export class PipelineFactory {
  public static createPipeline(mode: PipelineWorkflowMode = 'COPY_GENERATION'): AIStage[] {
    return PipelineRegistry.getPipeline(mode);
  }
}
