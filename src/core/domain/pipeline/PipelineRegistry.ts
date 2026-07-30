import { AIStage } from './AIStage';
import { FeatureFlagStage } from './stages/FeatureFlagStage';
import { LearningStage } from './stages/LearningStage';
import { PromptStage } from './stages/PromptStage';
import { CostControlStage } from './stages/CostControlStage';
import { ProviderStage } from './stages/ProviderStage';
import { ValidationStage } from './stages/ValidationStage';
import { LoggingStage } from './stages/LoggingStage';

export class PipelineRegistry {
  private static registry = new Map<string, AIStage[]>();

  static {
    // Registros Padrão v1.0
    this.register('COPY_GENERATION', [
      new FeatureFlagStage(),
      new LearningStage(),
      new PromptStage(),
      new CostControlStage(),
      new ProviderStage(),
      new ValidationStage(),
      new LoggingStage(),
    ]);

    this.register('PRODUCT_ANALYSIS', [
      new FeatureFlagStage(),
      new LearningStage(),
      new ProviderStage(),
      new LoggingStage(),
    ]);

    this.register('SEO_ANALYSIS', [
      new FeatureFlagStage(),
      new PromptStage(),
      new ProviderStage(),
      new ValidationStage(),
    ]);
  }

  public static register(mode: string, stages: AIStage[]): void {
    this.registry.set(mode.toUpperCase(), stages);
    console.log(`[PipelineRegistry] 📌 Pipeline registrado para modo: ${mode.toUpperCase()} (${stages.length} estágios)`);
  }

  public static getPipeline(mode: string): AIStage[] {
    const key = mode.toUpperCase();
    const pipeline = this.registry.get(key);
    if (!pipeline) {
      console.warn(`[PipelineRegistry] ⚠️ Pipeline '${key}' não encontrado. Utilizando fallback COPY_GENERATION.`);
      return this.registry.get('COPY_GENERATION') || [];
    }
    return pipeline;
  }
}
