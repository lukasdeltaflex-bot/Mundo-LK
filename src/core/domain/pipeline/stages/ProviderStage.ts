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

    const preferredProvider = process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : 'gemini');
    let adapter = AIModelSelectorService.selectProvider(preferredProvider);
    let aiResult;

    try {
      aiResult = await (adapter as GeminiAIAdapter).generateOfferContent(
        context.product,
        context.style,
        context.commercialGoal,
        context.generationMode,
        context.hierarchicalContext?.winningStrategyPrompt,
        context.prompt
      );
    } catch (primaryErr) {
      // Se OpenAI falhar (ex: créditos recém-adicionados aguardando sync) e existir chave Gemini, alterna graciosamente
      if (preferredProvider === 'openai' && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
        console.warn('[ProviderStage] ⚠️ Provedor OpenAI falhou. Alternando automaticamente para GeminiAIAdapter...', primaryErr);
        const geminiAdapter = AIModelSelectorService.selectProvider('gemini');
        aiResult = await (geminiAdapter as GeminiAIAdapter).generateOfferContent(
          context.product,
          context.style,
          context.commercialGoal,
          context.generationMode,
          context.hierarchicalContext?.winningStrategyPrompt,
          context.prompt
        );
      } else {
        throw primaryErr;
      }
    }

    context.analysis = (aiResult as any).analysis as GeminiOfferAnalysis;

    if (context.analysis) {
      await AICacheManagerService.saveCachedAnalysis(cacheKey, context.analysis);
    }
  }
}
