/**
 * Value Object for tracking AI Token usage and estimated cost.
 */
export class AICost {
  public readonly promptTokens: number;
  public readonly completionTokens: number;
  public readonly totalTokens: number;
  public readonly estimatedCostUsd: number;
  public readonly modelUsed: string;

  constructor(
    promptTokens: number,
    completionTokens: number,
    modelUsed: string,
    estimatedCostUsd: number = 0
  ) {
    this.promptTokens = Math.max(0, promptTokens);
    this.completionTokens = Math.max(0, completionTokens);
    this.totalTokens = this.promptTokens + this.completionTokens;
    this.modelUsed = modelUsed;
    this.estimatedCostUsd = Math.max(0, estimatedCostUsd);
  }

  public static create(
    promptTokens: number,
    completionTokens: number,
    modelUsed: string,
    estimatedCostUsd: number = 0
  ): AICost {
    return new AICost(promptTokens, completionTokens, modelUsed, estimatedCostUsd);
  }
}
