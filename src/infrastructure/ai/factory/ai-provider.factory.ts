import { IAIProviderAdapter } from '../../../core/domain/ports/ai/IAIProviderAdapter';
import { GeminiAIAdapter } from '../providers/gemini.adapter';
import { OpenAIAdapter } from '../providers/openai.adapter';
import { ClaudeAIAdapter } from '../providers/claude.adapter';
import { DeepSeekAIAdapter } from '../providers/deepseek.adapter';

export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'deepseek';

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
  }

  public static register(adapter: IAIProviderAdapter): void {
    this.providers.set(adapter.providerName.toLowerCase(), adapter);
  }

  public static getProvider(providerType: AIProviderType = 'gemini'): IAIProviderAdapter {
    for (const [key, adapter] of this.providers.entries()) {
      if (key.includes(providerType.toLowerCase())) {
        return adapter;
      }
    }
    // Default fallback to Gemini
    return this.providers.get('gemini-2.5-flash') || new GeminiAIAdapter();
  }

  public static getAllProviders(): IAIProviderAdapter[] {
    return Array.from(this.providers.values());
  }
}
