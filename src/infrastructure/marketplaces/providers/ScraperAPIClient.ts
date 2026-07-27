import { extractProductDataFromHtml } from '../scraper/html-parser';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

export class ScraperAPIClient {
  private apiKey = process.env.SCRAPERAPI_KEY || '';

  public async extract(url: string, marketplaceSlug: string): Promise<Partial<ProductExtractionResult> | null> {
    if (!this.apiKey) {
      console.warn(`[ScraperAPI] Ignorado: SCRAPERAPI_KEY não configurada.`);
      return null;
    }

    try {
      console.log(`[ScraperAPI] 🚀 Acionando ScraperAPI para: ${url}`);
      const targetUrl = encodeURIComponent(url);
      const apiUrl = `http://api.scraperapi.com?api_key=${this.apiKey}&url=${targetUrl}&render=true`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`[ScraperAPI] Falha HTTP ${res.status}`);
        return null;
      }

      const html = await res.text();
      const parsed = extractProductDataFromHtml(html, url, marketplaceSlug);

      return {
        title: parsed.title,
        description: parsed.description,
        currentPrice: parsed.price,
        originalPrice: parsed.oldPrice,
        discountPercentage: parsed.discount,
        image: parsed.image,
        brand: parsed.brand,
        category: parsed.category,
      };
    } catch (err) {
      console.error(`[ScraperAPI] Erro:`, err);
      return null;
    }
  }
}
