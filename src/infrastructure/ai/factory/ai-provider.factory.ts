import { IAIProviderAdapter } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { GeminiAIAdapter } from '../providers/gemini.adapter';
import { OpenAIAdapter } from '../providers/openai.adapter';
import { ClaudeAIAdapter } from '../providers/claude.adapter';
import { DeepSeekAIAdapter } from '../providers/deepseek.adapter';
import { OpenRouterAIAdapter } from '../providers/openrouter.adapter';

export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'openrouter';

/**
 * AI Provider Factory.
 * Resolves AI Adapters dynamically based on provider type or task requirement.
 */
export class AIProviderFactory {
  private static providers: Map<string, IAIProviderAdapter> = new Map();

  static {
    AIProviderFactory.register(new GeminiAIAdapter());
    AIProviderFactory.register(new OpenAIAdapter());
    AIProviderFactory.register(new ClaudeAIAdapter());
    AIProviderFactory.register(new DeepSeekAIAdapter());
    AIProviderFactory.register(new OpenRouterAIAdapter());
  }

  public static register(adapter: IAIProviderAdapter): void {
    this.providers.set(adapter.providerName.toLowerCase(), adapter);
  }

  public static getProvider(providerType: AIProviderType = 'openai'): IAIProviderAdapter {
    for (const [key, adapter] of this.providers.entries()) {
      if (key.includes(providerType.toLowerCase())) {
        return adapter;
      }
    }
    // Default fallback to OpenAI
    return this.providers.get('gpt-4o-mini') || new OpenAIAdapter();
  }

  public static getAllProviders(): IAIProviderAdapter[] {
    return Array.from(this.providers.values());
  }
}
