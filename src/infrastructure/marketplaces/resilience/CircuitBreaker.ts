export class CircuitBreaker {
  private static instance: CircuitBreaker;
  private failures: Map<string, { count: number; lastFailure: number }> = new Map();
  private maxFailures: number = 10;
  private cooldownMs: number = 10 * 60 * 1000; // 10 minutes

  private constructor() {}

  public static getInstance(): CircuitBreaker {
    if (!CircuitBreaker.instance) {
      CircuitBreaker.instance = new CircuitBreaker();
    }
    return CircuitBreaker.instance;
  }

  public isOpen(providerName: string): boolean {
    const record = this.failures.get(providerName);
    if (!record) return false;

    const now = Date.now();
    if (record.count >= this.maxFailures) {
      if (now - record.lastFailure < this.cooldownMs) {
        return true; // Circuit is OPEN (blocked)
      } else {
        // Cooldown passed, reset
        this.failures.delete(providerName);
        return false;
      }
    }
    return false;
  }

  public recordSuccess(providerName: string): void {
    this.failures.delete(providerName);
  }

  public recordFailure(providerName: string): void {
    const now = Date.now();
    const current = this.failures.get(providerName) || { count: 0, lastFailure: now };
    this.failures.set(providerName, {
      count: current.count + 1,
      lastFailure: now,
    });
  }
}
