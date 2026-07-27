import { extractProductDataFromHtml } from '../scraper/html-parser';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

export class LocalScraperProvider {
  public async extract(url: string, marketplaceSlug: string): Promise<Partial<ProductExtractionResult> | null> {
    try {
      console.log(`[LocalScraper] 🔍 Executando extração local de HTML para: ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[LocalScraper] Resposta HTTP não OK (${res.status})`);
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
      console.warn(`[LocalScraper] Exceção na extração local:`, err);
      return null;
    }
  }
}
