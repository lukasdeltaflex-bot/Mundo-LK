import { IProviderManager, ProviderExtractionResult } from '../../../core/domain/ports/marketplaces/IProviderManager';
import { MercadoLivreAPIProvider } from './MercadoLivreAPIProvider';
import { AmazonAPIProvider } from './AmazonAPIProvider';
import { ShopeeAPIProvider } from './ShopeeAPIProvider';
import { ApifyProvider } from './ApifyProvider';
import { ZenRowsClient } from './ZenRowsClient';
import { ScrapingBeeClient } from './ScrapingBeeClient';
import { ScraperAPIClient } from './ScraperAPIClient';
import { ChromeHeadlessProvider } from './ChromeHeadlessProvider';
import { LocalScraperProvider } from './LocalScraperProvider';
import { CircuitBreaker } from '../resilience/CircuitBreaker';
import { ProviderHealthMonitor } from '../resilience/ProviderHealthMonitor';
import { ProviderScoreEngine } from '../resilience/ProviderScoreEngine';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

interface InternalProvider {
  name: string;
  extract: (url: string, marketplaceSlug: string) => Promise<Partial<ProductExtractionResult> | null>;
}

export class ProviderManager implements IProviderManager {
  private circuitBreaker = CircuitBreaker.getInstance();
  private healthMonitor = ProviderHealthMonitor.getInstance();
  private scoreEngine = ProviderScoreEngine.getInstance();

  private providers: InternalProvider[];

  constructor() {
    const mlApi = new MercadoLivreAPIProvider();
    const amazonApi = new AmazonAPIProvider();
    const shopeeApi = new ShopeeAPIProvider();
    const apify = new ApifyProvider();
    const zenRows = new ZenRowsClient();
    const scrapingBee = new ScrapingBeeClient();
    const scraperApi = new ScraperAPIClient();
    const chromeHeadless = new ChromeHeadlessProvider();
    const localScraper = new LocalScraperProvider();

    this.providers = [
      { name: 'MercadoLivreAPI', extract: (u, m) => mlApi.extract(u, m) },
      { name: 'AmazonAPI', extract: (u, m) => amazonApi.extract(u, m) },
      { name: 'ShopeeAPI', extract: (u, m) => shopeeApi.extract(u, m) },
      { name: 'Apify', extract: (u, m) => apify.extract(u, m) },
      { name: 'ZenRows', extract: (u, m) => zenRows.extract(u, m) },
      { name: 'ScrapingBee', extract: (u, m) => scrapingBee.extract(u, m) },
      { name: 'ScraperAPI', extract: (u, m) => scraperApi.extract(u, m) },
      { name: 'ChromeHeadless', extract: (u, m) => chromeHeadless.extract(u, m) },
      { name: 'LocalScraper', extract: (u, m) => localScraper.extract(u, m) },
    ];
  }

  public async extract(url: string, marketplaceSlug: string): Promise<ProviderExtractionResult> {
    console.log(`[ProviderManager] 🚀 Iniciando waterfall de extração para: ${url}`);
    const rankedProviders = this.scoreEngine.rankProviders(this.providers);

    for (const provider of rankedProviders) {
      if (this.circuitBreaker.isOpen(provider.name)) {
        console.warn(`[CircuitBreaker] ⚠️ Provider ${provider.name} bloqueado temporariamente (Circuit OPEN). Pulando...`);
        continue;
      }

      console.log(`[ProviderManager] 🔄 Testando provedor: ${provider.name}`);
      const startTime = Date.now();

      // Smart Retry: Até 2 tentativas com failover suave
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const result = await provider.extract(url, marketplaceSlug);
          const durationMs = Date.now() - startTime;

          if (result && (result.title || result.currentPrice)) {
            console.log(`[${provider.name}] ✅ Extração bem-sucedida em ${durationMs}ms (Tentativa ${attempt})`);
            this.circuitBreaker.recordSuccess(provider.name);
            this.healthMonitor.reportStatus(provider.name, true);
            this.scoreEngine.recordExecution(provider.name, true, durationMs);

            return {
              data: result,
              providerName: provider.name,
              success: true,
              durationMs,
            };
          }
        } catch (err) {
          console.warn(`[${provider.name}] ⚠️ Tentativa ${attempt} falhou:`, err);
        }
      }

      // Record failure for this provider after retries failed
      const durationMs = Date.now() - startTime;
      console.warn(`[ProviderManager] ❌ Provider ${provider.name} falhou. Avançando no waterfall...`);
      this.circuitBreaker.recordFailure(provider.name);
      this.healthMonitor.reportStatus(provider.name, false);
      this.scoreEngine.recordExecution(provider.name, false, durationMs);
    }

    console.error(`[ProviderManager] 💥 Todos os provedores do waterfall falharam para ${url}`);
    return {
      data: null,
      providerName: 'None',
      success: false,
      durationMs: 0,
      error: 'Todos os provedores de extração falharam.',
    };
  }
}
