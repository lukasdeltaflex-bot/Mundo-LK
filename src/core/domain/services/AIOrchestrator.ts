import { Product } from '@/core/domain/entities/product.entity';
import { OfferStyle, CommercialGoal, AIGenerationMode } from '@/infrastructure/ai/providers/gemini.adapter';
import { AIExecutionContext, AIModelPolicy } from '@/core/domain/entities/AIExecutionContext';
import { PipelineFactory, PipelineWorkflowMode } from '@/core/domain/pipeline/PipelineFactory';

export class AIOrchestrator {
  /**
   * Main entry point executing the pipeline instantiated by PipelineFactory
   */
  public static async generateOffer(params: {
    product: Product;
    userId: string;
    style?: OfferStyle;
    commercialGoal?: CommercialGoal;
    generationMode?: AIGenerationMode;
    policy?: AIModelPolicy;
    workflowMode?: PipelineWorkflowMode;
  }): Promise<AIExecutionContext> {
    const startTime = Date.now();
    const workflowMode = params.workflowMode || 'COPY_GENERATION';
    const stages = PipelineFactory.createPipeline(workflowMode);

    const context: AIExecutionContext = {
      product: params.product,
      userId: params.userId,
      style: params.style || 'padrao',
      commercialGoal: params.commercialGoal || 'maxima_conversao',
      generationMode: params.generationMode || 'profissional',
      policy: params.policy || 'BALANCED',
    };

    console.log(`[AIOrchestrator] 🧠 Executando pipeline (${workflowMode}) de ${stages.length} estágios para ${context.product.title}`);

    for (const stage of stages) {
      try {
        await stage.execute(context);
      } catch (err) {
        console.error(`[AIOrchestrator] ⚠️ Erro no estágio ${stage.name}:`, err);
        if (!context.errors) context.errors = [];
        context.errors.push(`[${stage.name}]: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    context.durationMs = Date.now() - startTime;
    console.log(`[AIOrchestrator] ✅ Pipeline finalizada em ${context.durationMs}ms.`);

    return context;
  }
}


