export interface IFeatureFlagService {
  isEnabled(flagKey: string): Promise<boolean>;
  getFlagValue<T>(flagKey: string, defaultValue: T): Promise<T>;
}
