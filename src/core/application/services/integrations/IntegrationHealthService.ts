import { FirestoreMarketplaceConnectionRepository } from '../../../../infrastructure/firebase/repositories/firestore-marketplace-connection.repository';
import { MarketplaceConnectionService } from './MarketplaceConnectionService';
import { AuditLogService } from '../AuditLogService';

export interface HealthCheckSummary {
  totalConnections: number;
  activeCount: number;
  expiredCount: number;
  errorCount: number;
  timestamp: string;
}

/**
 * IntegrationHealthService — Serviço Dedicado de Monitoramento de Saúde de Tokens (Release 2.2.8.2)
 *
 * Responsável EXCLUSIVAMENTE por monitorar a validade dos tokens, detectar expirações,
 * atualizar o painel e emitir alertas preventivos.
 */
export class IntegrationHealthService {
  private static instance: IntegrationHealthService;
  private repo = new FirestoreMarketplaceConnectionRepository();

  private constructor() {}

  public static getInstance(): IntegrationHealthService {
    if (!IntegrationHealthService.instance) {
      IntegrationHealthService.instance = new IntegrationHealthService();
    }
    return IntegrationHealthService.instance;
  }

  public async evaluateAllConnections(userId: string): Promise<HealthCheckSummary> {
    const now = new Date().toISOString();
    const connections = await this.repo.findAllByUserId(userId);

    let activeCount = 0;
    let expiredCount = 0;
    let errorCount = 0;

    for (const conn of connections) {
      const testRes = await MarketplaceConnectionService.getInstance().testRealConnection(
        conn.marketplaceSlug,
        conn.credentials
      );

      if (testRes.success) {
        conn.status = 'CONNECTED';
        conn.healthScore = 100;
        conn.lastError = null;
        activeCount++;
      } else {
        const isExpired =
          testRes.message.toLowerCase().includes('token') ||
          testRes.message.toLowerCase().includes('unauthorized');
        conn.status = isExpired ? 'EXPIRED' : 'ERROR';
        conn.healthScore = isExpired ? 40 : 20;
        conn.lastError = testRes.message;

        if (isExpired) expiredCount++;
        else errorCount++;

        AuditLogService.getInstance().log({
          userId,
          tenantId: userId,
          action: isExpired ? 'TOKEN_EXPIRED' : 'CONNECTION_TEST_FAILED',
          module: 'integration_health',
          entity: 'IntegrationConnection',
          entityId: conn.id,
          metadata: { error: testRes.message, marketplaceSlug: conn.marketplaceSlug },
        });
      }

      conn.lastTestedAt = now;
      await this.repo.save(conn);
    }

    return {
      totalConnections: connections.length,
      activeCount,
      expiredCount,
      errorCount,
      timestamp: now,
    };
  }
}
