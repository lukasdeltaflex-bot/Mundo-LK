export type ProviderHealthStatus = 'OK' | 'DEGRADED' | 'OFFLINE';

export interface ProviderHealthReport {
  providerName: string;
  status: ProviderHealthStatus;
  consecutiveFailures: number;
  lastChecked: string;
}

export class ProviderHealthMonitor {
  private static instance: ProviderHealthMonitor;
  private reports: Map<string, ProviderHealthReport> = new Map();

  private constructor() {}

  public static getInstance(): ProviderHealthMonitor {
    if (!ProviderHealthMonitor.instance) {
      ProviderHealthMonitor.instance = new ProviderHealthMonitor();
    }
    return ProviderHealthMonitor.instance;
  }

  public reportStatus(providerName: string, success: boolean): void {
    const existing = this.reports.get(providerName) || {
      providerName,
      status: 'OK',
      consecutiveFailures: 0,
      lastChecked: new Date().toISOString(),
    };

    if (success) {
      existing.consecutiveFailures = 0;
      existing.status = 'OK';
    } else {
      existing.consecutiveFailures += 1;
      if (existing.consecutiveFailures >= 5) {
        existing.status = 'OFFLINE';
      } else if (existing.consecutiveFailures >= 2) {
        existing.status = 'DEGRADED';
      }
    }

    existing.lastChecked = new Date().toISOString();
    this.reports.set(providerName, existing);
  }

  public getReport(providerName: string): ProviderHealthReport {
    return this.reports.get(providerName) || {
      providerName,
      status: 'OK',
      consecutiveFailures: 0,
      lastChecked: new Date().toISOString(),
    };
  }

  public getAllReports(): ProviderHealthReport[] {
    return Array.from(this.reports.values());
  }
}
