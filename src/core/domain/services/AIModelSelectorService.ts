import { IAIProviderAdapter } from '@/core/domain/ports/ai/IAIProviderAdapter';
import { AIProviderFactory } from '@/infrastructure/ai/factory/ai-provider.factory';
import { GeminiAIAdapter } from '@/infrastructure/ai/providers/gemini.adapter';

export class AIModelSelectorService {
  public static selectProvider(preferredProvider: string = 'gemini'): IAIProviderAdapter {
    try {
      const adapter = AIProviderFactory.getProvider(preferredProvider as any);
      if (adapter) return adapter;
    } catch {
      // Fallback gracioso para Gemini
    }
    return new GeminiAIAdapter();
  }
}
