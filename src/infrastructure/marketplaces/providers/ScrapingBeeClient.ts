import { extractProductDataFromHtml } from '../scraper/html-parser';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

export class ScrapingBeeClient {
  private apiKey = process.env.SCRAPINGBEE_API_KEY || '';

  public async extract(url: string, marketplaceSlug: string): Promise<Partial<ProductExtractionResult> | null> {
    if (!this.apiKey) {
      console.warn(`[ScrapingBee] Ignorado: SCRAPINGBEE_API_KEY não configurada.`);
      return null;
    }

    try {
      console.log(`[ScrapingBee] 🚀 Acionando API ScrapingBee para: ${url}`);
      const targetUrl = encodeURIComponent(url);
      const apiUrl = `https://app.scrapingbee.com/api/v1/?api_key=${this.apiKey}&url=${targetUrl}&render_js=true`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`[ScrapingBee] Falha HTTP ${res.status}`);
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
      console.error(`[ScrapingBee] Erro:`, err);
      return null;
    }
  }
}
