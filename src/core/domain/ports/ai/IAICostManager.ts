import { AICost } from '../../value-objects/ai-cost.vo';

export interface IAICostManager {
  trackUsage(cost: AICost): Promise<void>;
  getTotalTokensUsed(): Promise<number>;
  getEstimatedMonthlyCostUsd(): Promise<number>;
}
