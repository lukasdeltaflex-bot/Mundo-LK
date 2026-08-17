import { IAIProviderAdapter } from '@/core/domain/ports/ai/IAIProviderAdapter';
import { AIProviderFactory } from '@/infrastructure/ai/factory/ai-provider.factory';
import { OpenAIAdapter } from '@/infrastructure/ai/providers/openai.adapter';

export class AIModelSelectorService {
  public static selectProvider(preferredProvider: string = 'openai'): IAIProviderAdapter {
    try {
      const adapter = AIProviderFactory.getProvider(preferredProvider as any);
      if (adapter) return adapter;
    } catch {
      // Fallback gracioso para OpenAI
    }
    return new OpenAIAdapter();
  }
}
