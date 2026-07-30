export interface AIFeatureFlags {
  learningEngine: boolean;
  marketplaceMemory: boolean;
  categoryMemory: boolean;
  explainability: boolean;
  autoRetry: boolean;
  costControl: boolean;
}

export class AIFeatureFlagsService {
  private static flags: AIFeatureFlags = {
    learningEngine: true,
    marketplaceMemory: true,
    categoryMemory: true,
    explainability: true,
    autoRetry: true,
    costControl: true,
  };

  public static getFlags(): AIFeatureFlags {
    return { ...this.flags };
  }

  public static isEnabled(flagName: keyof AIFeatureFlags): boolean {
    return this.flags[flagName] ?? true;
  }

  public static updateFlags(newFlags: Partial<AIFeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
    console.log('[AIFeatureFlagsService] 🚩 Feature flags atualizadas:', this.flags);
  }
}
