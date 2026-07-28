import { extractProductDataFromHtml } from '../scraper/html-parser';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

export class ChromeHeadlessProvider {
  public name = 'ChromeHeadless';

  public async extract(url: string, marketplaceSlug: string): Promise<Partial<ProductExtractionResult> | null> {
    if (typeof window !== 'undefined') {
      // Navegadores não executam Playwright no frontend
      return null;
    }

    const startTotal = Date.now();
    console.log(`[Chrome] 🚀 Inicializando navegador Headless para: ${url}`);
    console.log(`[Chrome] URL: ${url}`);
    console.log(`[Chrome] Marketplace: ${marketplaceSlug}`);

    let browser: any = null;
    let context: any = null;
    let page: any = null;

    try {
      // Dynamic import isolado para o lado do servidor Node.js
      const playwrightName = 'playwright';
      const { chromium } = await import(/* webpackIgnore: true */ playwrightName);
      
      const startLaunch = Date.now();
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });
      console.log(`[Chrome] Tempo de abertura: ${Date.now() - startLaunch}ms`);

      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        locale: 'pt-BR',
      });

      page = await context.newPage();

      const startNav = Date.now();
      // Navigation timeout 10 seconds
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      
      // Wait briefly for JS hydration
      await page.waitForTimeout(2000);
      console.log(`[Chrome] Tempo de renderização: ${Date.now() - startNav}ms`);

      const startExtract = Date.now();
      const html = await page.content();
      console.log(`[Chrome] DOM carregado (${html.length} bytes) em ${Date.now() - startExtract}ms`);

      const parsed = extractProductDataFromHtml(html, url, marketplaceSlug);

      console.log(`[Chrome] Título encontrado: ${parsed.title || '—'}`);
      console.log(`[Chrome] Preço encontrado: ${parsed.price ? `R$ ${parsed.price}` : '—'}`);
      console.log(`[Chrome] Imagem encontrada: ${parsed.image ? 'Sim' : '—'}`);
      console.log(`[Chrome] Tempo total: ${Date.now() - startTotal}ms`);

      if (parsed.title || parsed.price) {
        return {
          title: parsed.title,
          description: parsed.description,
          currentPrice: parsed.price,
          originalPrice: parsed.oldPrice,
          discountPercentage: parsed.discount,
          image: parsed.image,
          brand: parsed.brand,
          category: parsed.category,
          shippingType: parsed.shipping,
        };
      }

      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Chrome] ⚠️ Exceção ou timeout no Chrome Headless (${Date.now() - startTotal}ms):`, msg);
      return null;
    } finally {
      // Guarantee proper resource cleanup without orphan processes
      if (page) {
        try { await page.close(); } catch {}
      }
      if (context) {
        try { await context.close(); } catch {}
      }
      if (browser) {
        try { await browser.close(); } catch {}
        console.log(`[Chrome] 🔒 Navegador fechado com sucesso.`);
      }
    }
  }
}
