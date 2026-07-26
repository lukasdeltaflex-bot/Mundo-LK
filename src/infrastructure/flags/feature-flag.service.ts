import { IFeatureFlagService } from '../../core/domain/ports/flags/IFeatureFlagService';

/**
 * Feature Flag Service implementation.
 * Allows toggling features on/off dynamically.
 */
export class FeatureFlagService implements IFeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Map<string, unknown> = new Map([
    ['ENABLE_AMAZON', true],
    ['ENABLE_MERCADO_LIVRE', true],
    ['ENABLE_SHOPEE', true],
    ['ENABLE_MAGALU', true],
    ['ENABLE_PREMIUM_AI', true],
    ['ENABLE_ANALYTICS', true],
    ['ENABLE_AUTOMATIONS', true],
    ['ENABLE_CAMPAIGNS', true],
    ['ENABLE_TEMPLATES', true],
    ['ENABLE_OFFER_SCORE', true],
  ]);

  constructor() {}

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  public async isEnabled(flagKey: string): Promise<boolean> {
    const val = this.flags.get(flagKey);
    return typeof val === 'boolean' ? val : true;
  }

  public async getFlagValue<T>(flagKey: string, defaultValue: T): Promise<T> {
    if (this.flags.has(flagKey)) {
      return this.flags.get(flagKey) as T;
    }
    return defaultValue;
  }

  public setFlag(flagKey: string, value: unknown): void {
    this.flags.set(flagKey, value);
  }
}
