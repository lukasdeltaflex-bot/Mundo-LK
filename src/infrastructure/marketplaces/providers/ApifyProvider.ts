import { extractProductDataFromHtml } from '../scraper/html-parser';
import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

export class ApifyProvider {
  public name = 'Apify';
  private apiKey = process.env.APIFY_API_TOKEN || '';
  private isEnabled = process.env.APIFY_ENABLED !== 'false';

  public async extract(url: string, marketplaceSlug: string): Promise<Partial<ProductExtractionResult> | null> {
    if (!this.apiKey || !this.isEnabled) {
      console.warn(`[Apify] Ignorado: APIFY_API_TOKEN não configurada ou APIFY_ENABLED=false.`);
      return null;
    }

    const start = Date.now();
    console.log(`[Apify] 🚀 Acionando Apify Provider para: ${url} (${marketplaceSlug})`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      // Call Apify Web Scraper Run Sync Get Dataset Items endpoint
      const apifyUrl = `https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${this.apiKey}&timeout=15`;
      
      const payload = {
        startUrls: [{ url }],
        pageFunction: `async function pageFunction(context) {
          const { $, request } = context;
          return {
            url: request.url,
            title: $('title').text().trim() || $('meta[property="og:title"]').attr('content'),
            html: $.html(),
          };
        }`,
      };

      const res = await fetch(apifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[Apify] ⚠️ Falha HTTP ${res.status} de Apify API (${Date.now() - start}ms)`);
        return null;
      }

      const items = await res.json();
      const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;

      if (!firstItem) {
        console.warn(`[Apify] ⚠️ Nenhum item retornado pelo Actor Apify (${Date.now() - start}ms)`);
        return null;
      }

      let parsed: any = {};
      if (firstItem.html) {
        parsed = extractProductDataFromHtml(firstItem.html, url, marketplaceSlug);
      }

      const title = firstItem.title || parsed.title || '';
      const currentPrice = firstItem.price || parsed.price || null;
      const image = firstItem.image || parsed.image || '';

      console.log(`[Apify] ✅ Extração finalizada em ${Date.now() - start}ms. Título: ${title || '—'}, Preço: ${currentPrice || '—'}`);

      if (title || currentPrice) {
        return {
          title,
          description: firstItem.description || parsed.description || '',
          currentPrice: typeof currentPrice === 'number' ? currentPrice : parseFloat(currentPrice) || null,
          originalPrice: firstItem.originalPrice || parsed.oldPrice || null,
          discountPercentage: firstItem.discountPercentage || parsed.discount || 0,
          image,
          brand: firstItem.brand || parsed.brand || '',
          category: firstItem.category || parsed.category || 'Geral',
          sellerName: firstItem.seller || parsed.sellerName || '',
          rating: firstItem.ratings || parsed.rating || 0,
          reviewCount: firstItem.reviewCount || parsed.reviewCount || 0,
          soldQuantity: firstItem.soldQuantity || parsed.soldQuantity || '',
          productId: firstItem.productId || parsed.productId || undefined,
        };
      }

      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Apify] ⚠️ Erro ou timeout no Apify Provider (${Date.now() - start}ms):`, msg);
      return null;
    }
  }
}
