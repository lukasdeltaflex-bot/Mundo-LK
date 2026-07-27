export interface ProviderScoreStats {
  providerName: string;
  totalRequests: number;
  successfulRequests: number;
  successRate: number; // 0 to 100%
  avgLatencyMs: number;
  score: number; // Combined dynamic score 0 to 100
}

export class ProviderScoreEngine {
  private static instance: ProviderScoreEngine;
  private stats: Map<string, { total: number; success: number; latencies: number[] }> = new Map();

  private constructor() {}

  public static getInstance(): ProviderScoreEngine {
    if (!ProviderScoreEngine.instance) {
      ProviderScoreEngine.instance = new ProviderScoreEngine();
    }
    return ProviderScoreEngine.instance;
  }

  public recordExecution(providerName: string, success: boolean, durationMs: number): void {
    const current = this.stats.get(providerName) || { total: 0, success: 0, latencies: [] };
    current.total += 1;
    if (success) current.success += 1;
    current.latencies.push(durationMs);
    if (current.latencies.length > 50) current.latencies.shift(); // Keep last 50 samples
    this.stats.set(providerName, current);
  }

  public getScore(providerName: string): number {
    const current = this.stats.get(providerName);
    if (!current || current.total === 0) return 80; // Default base score for untried providers

    const successRate = (current.success / current.total) * 100;
    const avgLatency = current.latencies.reduce((a, b) => a + b, 0) / current.latencies.length;

    // Latency penalty: < 2s = 100%, 5s = 50%, > 10s = 0%
    const latencyScore = Math.max(0, Math.min(100, 100 - (avgLatency - 2000) / 80));

    // Weighted score: 70% success rate + 30% latency score
    const finalScore = Math.round(successRate * 0.7 + latencyScore * 0.3);
    return Math.max(0, Math.min(100, finalScore));
  }

  public rankProviders<T extends { name: string }>(providers: T[]): T[] {
    return [...providers].sort((a, b) => this.getScore(b.name) - this.getScore(a.name));
  }
}
