import { MarketplaceAccessGateway, AuditCallLog } from '../../domain/services/MarketplaceAccessGateway';
import { MarketplaceSlug } from '../../domain/providers/IMarketplaceProvider';

export interface MarketplaceStatusInfo {
  marketplace: MarketplaceSlug;
  name: string;
  appId: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
  latencyMs: number;
  lastSyncAt: string | null;
  errorCount: number;
}

export class MarketplaceCentralService {
  private static instance: MarketplaceCentralService;
  private gateway = MarketplaceAccessGateway.getInstance();

  private constructor() {}

  public static getInstance(): MarketplaceCentralService {
    if (!MarketplaceCentralService.instance) {
      MarketplaceCentralService.instance = new MarketplaceCentralService();
    }
    return MarketplaceCentralService.instance;
  }

  /**
   * Testa a conectividade em tempo real da API do marketplace especificado.
   */
  public async testConnection(marketplace: MarketplaceSlug): Promise<MarketplaceStatusInfo> {
    const testUrl =
      marketplace === 'mercadolivre'
        ? 'https://produto.mercadolivre.com.br/MLB-1234567890-item-teste'
        : 'https://shopee.com.br/product/12345/67890';

    const startTime = Date.now();
    try {
      await this.gateway.fetchOfferData(testUrl, marketplace);
      const latencyMs = Date.now() - startTime;

      const appId =
        marketplace === 'mercadolivre'
          ? process.env.MERCADO_LIVRE_CLIENT_ID || '5566961113388868'
          : process.env.SHOPEE_PARTNER_ID || '18317770060';

      return {
        marketplace,
        name: marketplace === 'mercadolivre' ? 'Mercado Livre Brasil' : 'Shopee Brasil',
        appId,
        status: 'CONNECTED',
        latencyMs,
        lastSyncAt: new Date().toISOString(),
        errorCount: 0,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const appId =
        marketplace === 'mercadolivre'
          ? process.env.MERCADO_LIVRE_CLIENT_ID || '5566961113388868'
          : process.env.SHOPEE_PARTNER_ID || '18317770060';

      return {
        marketplace,
        name: marketplace === 'mercadolivre' ? 'Mercado Livre Brasil' : 'Shopee Brasil',
        appId,
        status: 'DEGRADED',
        latencyMs,
        lastSyncAt: new Date().toISOString(),
        errorCount: 1,
      };
    }
  }

  public getAuditLogs(): AuditCallLog[] {
    return this.gateway.getAuditLogs();
  }
}
