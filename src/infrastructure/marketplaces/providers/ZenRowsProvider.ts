import { IExtractionProvider, ExtractedData } from '../../../core/domain/ports/marketplaces/IExtractionProvider';
import { extractProductDataFromHtml } from '../scraper/html-parser';

export class ZenRowsProvider implements IExtractionProvider {
  private apiKey = process.env.ZENROWS_API_KEY || '';

  public canHandle(marketplaceSlug: string, url: string): boolean {
    return true; // ZenRows is the universal fallback
  }

  public async extract(url: string, marketplaceSlug: string): Promise<ExtractedData | null> {
    const start = Date.now();
    
    if (!this.apiKey) {
      console.warn(`[Provider:ZenRows] Ignorado em ${Date.now() - start}ms: ZENROWS_API_KEY não configurada.`);
      return null;
    }

    try {
      console.log(`[Provider:ZenRows] 🚀 Acionando ZenRows API para: ${url}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // ZenRows pode demorar

      // ZenRows config: premium proxies (brazil), js render (js_render=true)
      const targetUrl = encodeURIComponent(url);
      const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${this.apiKey}&url=${targetUrl}&js_render=true&premium_proxy=true&proxy_country=br`;

      const res = await fetch(zenrowsUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`[Provider:ZenRows] ❌ Falha HTTP ${res.status} em ${Date.now() - start}ms`);
        return null;
      }

      const html = await res.text();
      
      // Parse the HTML using our internal parser
      const parsed = extractProductDataFromHtml(html, url, marketplaceSlug);
      
      console.log(`[Provider:ZenRows] ✅ Sucesso em ${Date.now() - start}ms: Score ${parsed.confidence}%`);
      
      return {
        ...parsed,
        source: 'ZenRows',
      };

    } catch (error) {
      console.error(`[Provider:ZenRows] ❌ Exceção em ${Date.now() - start}ms:`, error);
      return null;
    }
  }
}
