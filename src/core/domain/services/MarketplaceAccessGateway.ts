import { MercadoLivreProvider } from '@/infrastructure/marketplaces/providers/MercadoLivreProvider';
import { ShopeeProvider } from '@/infrastructure/marketplaces/providers/ShopeeProvider';
import { RawMarketplaceExtractionResult, MarketplaceSlug } from '../providers/IMarketplaceProvider';

export interface AuditCallLog {
  id: string;
  marketplace: MarketplaceSlug;
  endpoint: string;
  latencyMs: number;
  status: 'SUCCESS' | 'ERROR' | 'CACHED';
  timestamp: string;
  errorMessage?: string;
}

export interface CachedResponse {
  data: RawMarketplaceExtractionResult;
  cachedAt: number;
}

export class MarketplaceAccessGateway {
  private static instance: MarketplaceAccessGateway;
  private mlProvider = new MercadoLivreProvider();
  private shopeeProvider = new ShopeeProvider();

  private cache: Map<string, CachedResponse> = new Map();
  private auditLogs: AuditCallLog[] = [];
  private cacheTtlMs = 15 * 60 * 1000; // Cache de 15 minutos para otimizar chamadas

  private constructor() {}

  public static getInstance(): MarketplaceAccessGateway {
    if (!MarketplaceAccessGateway.instance) {
      MarketplaceAccessGateway.instance = new MarketplaceAccessGateway();
    }
    return MarketplaceAccessGateway.instance;
  }

  /**
   * Executa a extração oficial com cache inteligente, medição de latência e auditoria.
   */
  public async fetchOfferData(url: string, marketplaceHint?: MarketplaceSlug): Promise<RawMarketplaceExtractionResult> {
    const cacheKey = `raw_${url}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    // Reutilização de Cache Válido
    if (cached && now - cached.cachedAt < this.cacheTtlMs) {
      this.recordLog({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        marketplace: cached.data.marketplace,
        endpoint: url,
        latencyMs: 0,
        status: 'CACHED',
        timestamp: new Date().toISOString(),
      });
      return cached.data;
    }

    const startTime = Date.now();
    const isShopee = url.includes('shopee') || marketplaceHint === 'shopee';
    const provider = isShopee ? this.shopeeProvider : this.mlProvider;

    try {
      const data = await provider.extractOfferData(url);
      const latencyMs = Date.now() - startTime;

      this.cache.set(cacheKey, { data, cachedAt: now });

      this.recordLog({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        marketplace: data.marketplace,
        endpoint: url,
        latencyMs,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });

      return data;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const targetMarketplace = isShopee ? 'shopee' : 'mercadolivre';

      this.recordLog({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        marketplace: targetMarketplace,
        endpoint: url,
        latencyMs,
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        errorMessage: err?.message || String(err),
      });

      throw err;
    }
  }

  private recordLog(log: AuditCallLog): void {
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 50) {
      this.auditLogs.pop(); // Mantém os últimos 50 logs auditados
    }
  }

  public getAuditLogs(): AuditCallLog[] {
    return [...this.auditLogs];
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
