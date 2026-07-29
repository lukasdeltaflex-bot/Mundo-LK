export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerStatus {
  providerSlug: string;
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number | null;
  nextAttemptAt: number | null;
}

export class CircuitBreakerService {
  private static instance: CircuitBreakerService;
  private circuits: Map<string, CircuitBreakerStatus> = new Map();
  private readonly failureThreshold = 3;
  private readonly recoveryTimeoutMs = 60000; // 60s timeout before HALF_OPEN

  private constructor() {}

  public static getInstance(): CircuitBreakerService {
    if (!CircuitBreakerService.instance) {
      CircuitBreakerService.instance = new CircuitBreakerService();
    }
    return CircuitBreakerService.instance;
  }

  public canExecute(providerSlug: string): boolean {
    const status = this.getStatus(providerSlug);
    if (status.state === 'CLOSED') return true;

    const now = Date.now();
    if (status.state === 'OPEN') {
      if (status.nextAttemptAt && now >= status.nextAttemptAt) {
        status.state = 'HALF_OPEN';
        this.circuits.set(providerSlug, status);
        return true;
      }
      return false;
    }

    return true; // HALF_OPEN allows a trial call
  }

  public recordSuccess(providerSlug: string): void {
    this.circuits.set(providerSlug, {
      providerSlug,
      state: 'CLOSED',
      failureCount: 0,
      lastFailureAt: null,
      nextAttemptAt: null,
    });
  }

  public recordFailure(providerSlug: string): void {
    const status = this.getStatus(providerSlug);
    const newFailures = status.failureCount + 1;
    const now = Date.now();

    if (newFailures >= this.failureThreshold) {
      this.circuits.set(providerSlug, {
        providerSlug,
        state: 'OPEN',
        failureCount: newFailures,
        lastFailureAt: now,
        nextAttemptAt: now + this.recoveryTimeoutMs,
      });
    } else {
      this.circuits.set(providerSlug, {
        ...status,
        failureCount: newFailures,
        lastFailureAt: now,
      });
    }
  }

  public getStatus(providerSlug: string): CircuitBreakerStatus {
    return (
      this.circuits.get(providerSlug) || {
        providerSlug,
        state: 'CLOSED',
        failureCount: 0,
        lastFailureAt: null,
        nextAttemptAt: null,
      }
    );
  }
}
