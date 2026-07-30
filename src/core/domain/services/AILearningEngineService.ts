import { UserAIPreferencesService, UserAIPreferences } from './UserAIPreferencesService';
import { WinningStrategyService } from './WinningStrategyService';
import { MarketplaceAIMemoryService, MarketplaceAIMemory } from './MarketplaceAIMemoryService';
import { CategoryAIMemoryService, CategoryAIMemory } from './CategoryAIMemoryService';
import { AIContextBuilder } from '@/infrastructure/ai/services/AIContextBuilder';

export interface AggregatedAIContext {
  userPrefs: UserAIPreferences | null;
  winningStrategyPrompt: string;
  marketplaceMem: MarketplaceAIMemory;
  categoryMem: CategoryAIMemory;
  fullHierarchicalPromptBlock: string;
  contextVersion: number;
}

export class AILearningEngineService {
  /**
   * Delegates prompt block construction to AIContextBuilder following strict 5-layer hierarchy and contextVersion: 1
   */
  public static async buildHierarchicalContext(params: {
    userId: string;
    marketplaceSlug: string;
    categoryId: string;
    diversityScore?: number;
  }): Promise<AggregatedAIContext> {
    const { userId, marketplaceSlug, categoryId, diversityScore = 85 } = params;

    // 1. User Preferences
    const userPrefs = await UserAIPreferencesService.getUserPreferences(userId);

    // 2. Winning Strategies (Top 3 Cap)
    const winningStrategyPrompt = await WinningStrategyService.getTopStrategiesContext(categoryId);

    // 3. Marketplace Memory
    const marketplaceMem = await MarketplaceAIMemoryService.getMarketplaceMemory(marketplaceSlug);

    // 4. Category Memory
    const categoryMem = await CategoryAIMemoryService.getCategoryMemory(categoryId);

    // 5. Delegate formatting to AIContextBuilder
    const builder = new AIContextBuilder();
    const fullHierarchicalPromptBlock = builder.buildConsolidatedPromptContext({
      userPrefs,
      winningStrategiesPrompt: winningStrategyPrompt,
      marketplaceMem,
      categoryMem,
      diversityScore,
    });

    return {
      userPrefs,
      winningStrategyPrompt,
      marketplaceMem,
      categoryMem,
      fullHierarchicalPromptBlock,
      contextVersion: AIContextBuilder.CONTEXT_VERSION,
    };
  }
}

