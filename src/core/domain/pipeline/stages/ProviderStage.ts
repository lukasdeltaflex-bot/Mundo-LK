import { AIStage } from '../AIStage';
import { AIExecutionContext } from '@/core/domain/entities/AIExecutionContext';
import { AICacheManagerService } from '@/core/domain/services/AICacheManagerService';
import { AIModelSelectorService } from '@/core/domain/services/AIModelSelectorService';
import { GeminiOfferAnalysis, GeminiAIAdapter } from '@/infrastructure/ai/providers/gemini.adapter';
import { OpenRouterAIAdapter } from '@/infrastructure/ai/providers/openrouter.adapter';

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

    const startTime = Date.now();
    const preferredProvider = process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ? 'gemini' : 'openai');
    let adapter = AIModelSelectorService.selectProvider(preferredProvider);
    let aiResult;

    try {
      console.log(`[ProviderStage] 🧠 Tentando provider primário: ${preferredProvider}`);
      aiResult = await (adapter as GeminiAIAdapter).generateOfferContent(
        context.product,
        context.style,
        context.commercialGoal,
        context.generationMode,
        context.hierarchicalContext?.winningStrategyPrompt,
        context.prompt
      );
      const durationMs = Date.now() - startTime;
      console.log(`[ProviderStage] ✅ Provider primário respondeu em ${durationMs}ms`);
    } catch (primaryErr) {
      const primaryReason = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      const durationMs = Date.now() - startTime;
      console.warn(
        `[ProviderStage] ⚠️ Provider primário (${preferredProvider}) falhou em ${durationMs}ms: ${primaryReason}`
      );

      // --- Fallback para OpenRouter ---
      if (process.env.OPENROUTER_API_KEY) {
        console.log('[ProviderStage] 🔄 Acionando fallback para OpenRouter...');
        const fallbackStart = Date.now();
        try {
          const openRouterAdapter = new OpenRouterAIAdapter();
          aiResult = await openRouterAdapter.generateOfferContent(
            context.product,
            context.style,
            context.commercialGoal,
            context.generationMode,
            context.hierarchicalContext?.winningStrategyPrompt,
            context.prompt,
            primaryReason // fallbackReason
          );
          const fbDuration = Date.now() - fallbackStart;
          console.log(`[ProviderStage] ✅ OpenRouter respondeu em ${fbDuration}ms (fallback)`);
        } catch (fallbackErr) {
          const fbReason = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          console.error(`[ProviderStage] 🚨 OpenRouter também falhou: ${fbReason}`);
          throw new Error(
            `Geração de IA indisponível — provider primário (${preferredProvider}) e fallback (OpenRouter) falharam. ` +
            `Primário: ${primaryReason}. Fallback: ${fbReason}`
          );
        }
      } else {
        // Sem chave OpenRouter: tenta fallback legado OpenAI → Gemini
        if (preferredProvider === 'openai' && (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
          console.warn('[ProviderStage] ⚠️ OPENROUTER_API_KEY ausente. Tentando fallback legado para Gemini...');
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
          throw new Error(
            `Geração de IA indisponível — provider primário (${preferredProvider}) falhou e nenhum fallback configurado. ` +
            `Motivo: ${primaryReason}. Configure OPENROUTER_API_KEY para ativar o fallback automático.`
          );
        }
      }
    }

    context.analysis = (aiResult as any).analysis as GeminiOfferAnalysis;

    if (context.analysis) {
      await AICacheManagerService.saveCachedAnalysis(cacheKey, context.analysis);
    }
  }
}
