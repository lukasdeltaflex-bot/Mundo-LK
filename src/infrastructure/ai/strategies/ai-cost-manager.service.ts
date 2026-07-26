import { IAICostManager } from '../../../core/domain/ports/ai/IAICostManager';
import { AICost } from '../../../core/domain/value-objects/ai-cost.vo';

/**
 * Concrete AI Cost Manager Service.
 * Tracks AI token usage, latency and financial cost.
 */
export class AICostManagerService implements IAICostManager {
  private static instance: AICostManagerService;
  private logs: AICost[] = [];

  constructor() {}

  public static getInstance(): AICostManagerService {
    if (!AICostManagerService.instance) {
      AICostManagerService.instance = new AICostManagerService();
    }
    return AICostManagerService.instance;
  }

  public async trackUsage(cost: AICost): Promise<void> {
    this.logs.push(cost);
  }

  public async getTotalTokensUsed(): Promise<number> {
    return this.logs.reduce((acc, curr) => acc + curr.totalTokens, 0);
  }

  public async getEstimatedMonthlyCostUsd(): Promise<number> {
    return this.logs.reduce((acc, curr) => acc + curr.estimatedCostUsd, 0);
  }
}
