import { extractProductDataFromHtml } from '../scraper/html-parser';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

export class ZenRowsClient {
  private apiKey = process.env.ZENROWS_API_KEY || '';

  public async extract(url: string, marketplaceSlug: string): Promise<Partial<ProductExtractionResult> | null> {
    if (!this.apiKey) {
      console.warn(`[ZenRows] Ignorado: ZENROWS_API_KEY não configurada.`);
      return null;
    }

    try {
      console.log(`[ZenRows] 🚀 Acionando ZenRows API para: ${url}`);
      const targetUrl = encodeURIComponent(url);
      const zenrowsUrl = `https://api.zenrows.com/v1/?apikey=${this.apiKey}&url=${targetUrl}&js_render=true&premium_proxy=true&proxy_country=br`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(zenrowsUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`[ZenRows] Falha HTTP ${res.status}`);
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
      console.error(`[ZenRows] Erro:`, err);
      return null;
    }
  }
}
