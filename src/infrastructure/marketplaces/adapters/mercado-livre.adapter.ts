import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { fetchProductMetadata, expandShortenedUrl } from '../scraper/product-page-scraper';

/**
 * Adapter for Mercado Livre Marketplace.
 *
 * CAMADA PIPELINE:
 *  L1 → Link expansion (resolve ml.br, mercado.com short links)
 *  L2 → ML Public API (api.mercadolibre.com/items/{id}) — JSON limpo, sem scraping
 *  L3 → HTML/JSON-LD scraping via fetchProductMetadata
 *  L4 → URL slug fallback (baixa confiança, abre tela assistida)
 */
export class MercadoLivreAdapter implements IMarketplaceAdapter {
  public readonly marketplaceSlug: string = 'mercadolivre';
  public readonly marketplaceName: string = 'Mercado Livre';

  public canHandle(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.includes('mercadolivre.com.br') ||
      lower.includes('mercadolibre.com') ||
      lower.includes('ml.br')
    );
  }

  public async extractProductData(url: string): Promise<ExtractedProductData> {
    // L1: Expand short links
    const expandedUrl = await expandShortenedUrl(url.trim());

    // L2: Try ML Public API first — fastest and most accurate
    const itemId = this.extractItemId(expandedUrl);
    if (itemId) {
      try {
        const apiResult = await this.fetchFromMLApi(itemId);
        if (apiResult && apiResult.title) {
          console.log(`[ML-API] Dados obtidos via API pública para: ${itemId}`);
          return apiResult;
        }
      } catch (err) {
        console.warn('[ML-API] Falha na API pública, tentando scraping HTML:', err);
      }
    }

    // L3: HTML/JSON-LD scraping
    const metadata = await fetchProductMetadata(expandedUrl, this.marketplaceSlug);

    if (metadata && metadata.title.length > 5) {
      return {
        title:           metadata.title,
        description:     metadata.description || `Produto disponível no ${this.marketplaceName}.`,
        brand:           metadata.brand || 'Desconhecida',
        categoryName:    metadata.category || 'Geral',
        mainImage:       metadata.image || '',
        gallery:         metadata.image ? [metadata.image] : [],
        currentPrice:    metadata.price ?? 0,
        previousPrice:   metadata.previousPrice ?? null,
        storeName:       this.marketplaceName,
        storeReputation: 'MercadoLíder Platinum',
        shippingInfo:    'Mercado Envios FULL (Entrega Rápida)',
        originalUrl:     expandedUrl,
        confidenceScore: metadata.confidenceScore,
        confidenceMode:  metadata.confidenceMode,
        confidenceItems: metadata.confidenceItems,
      };
    }

    // L4: URL slug fallback — triggers assisted/manual screen
    const slug = this.extractSlugFromUrl(expandedUrl);
    const score = slug ? 45 : 20;
    return {
      title:           slug || '',
      description:     '',
      brand:           '',
      categoryName:    'Geral',
      mainImage:       '',
      gallery:         [],
      currentPrice:    0,
      previousPrice:   null,
      storeName:       this.marketplaceName,
      storeReputation: 'Vendedor Mercado Livre',
      originalUrl:     expandedUrl,
      confidenceScore: score,
      confidenceMode:  score >= 50 ? 'assisted' : 'manual',
      confidenceItems: [
        { label: 'Título oficial do anúncio', found: !!slug, weight: 30 },
        { label: 'Preço atual', found: false, weight: 25 },
        { label: 'Imagem principal do produto', found: false, weight: 20 },
        { label: 'Categoria ou Marca', found: false, weight: 15 },
        { label: 'Descrição / Detalhes', found: false, weight: 10 },
      ],
    };
  }

  // ── Layer 2: ML Public API ───────────────────────────────────────────────────

  private extractItemId(url: string): string | null {
    // Matches MLB-123456789 anywhere in path or query
    const m = url.match(/MLB[-]?(\d+)/i);
    if (m) return `MLB${m[1]}`;
    return null;
  }

  private async fetchFromMLApi(itemId: string): Promise<ExtractedProductData | null> {
    const endpoint = `https://api.mercadolibre.com/items/${itemId}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const item = await res.json() as Record<string, unknown>;

    const title = String(item.title || '');
    if (!title) return null;

    const price = Number(item.price) || null;
    const originalPrice = Number((item as Record<string, unknown>)['original_price']) || null;
    const thumbnail = String(item.thumbnail || '').replace(/^http:/, 'https:');
    const pictures = (item.pictures as Array<{ url: string }> | undefined) || [];
    const mainImage = pictures[0]?.url?.replace(/^http:/, 'https:') || thumbnail || '';
    const condition = String(item.condition || '');
    const categoryId = String(item.category_id || 'Geral');
    const brandAttr = (item.attributes as Array<{ id: string; value_name: string }> | undefined)
      ?.find((a) => a.id === 'BRAND')?.value_name || '';

    const items: Array<{ label: string; found: boolean; weight: number }> = [
      { label: 'Título oficial do anúncio', found: title.length > 5, weight: 30 },
      { label: 'Preço atual', found: !!price, weight: 25 },
      { label: 'Imagem principal do produto', found: !!mainImage, weight: 20 },
      { label: 'Categoria ou Marca', found: !!(categoryId || brandAttr), weight: 15 },
      { label: 'Descrição / Detalhes', found: !!condition, weight: 10 },
    ];
    const score = items.reduce((a, i) => a + (i.found ? i.weight : 0), 0);
    const mode: 'automatic' | 'assisted' | 'manual' = score >= 80 ? 'automatic' : score >= 50 ? 'assisted' : 'manual';

    return {
      title,
      description: condition === 'new' ? 'Produto novo em estoque.' : 'Produto usado.',
      brand:           brandAttr || 'Desconhecida',
      categoryName:    categoryId,
      mainImage,
      gallery:         pictures.slice(0, 5).map((p) => p.url?.replace(/^http:/, 'https:')).filter(Boolean),
      currentPrice:    price ?? 0,
      previousPrice:   originalPrice && originalPrice > (price ?? 0) ? originalPrice : null,
      storeName:       this.marketplaceName,
      storeReputation: 'MercadoLíder Platinum',
      shippingInfo:    'Mercado Envios FULL',
      originalUrl:     `https://produto.mercadolivre.com.br/${itemId}`,
      confidenceScore: score,
      confidenceMode:  mode,
      confidenceItems: items,
    };
  }

  private extractSlugFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const parts = pathname.split('/').filter(Boolean);
      const slug = parts.find((p) => p.startsWith('MLB')) ?? parts[parts.length - 1];
      return slug ? slug.replace(/[-_]+/g, ' ').replace(/MLB\d+\s*/i, '').trim() : '';
    } catch {
      return '';
    }
  }

  public async buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string> {
    const cleanUrl = originalUrl.split('?')[0];
    return `${cleanUrl}?utm_source=affiliate&utm_medium=referral&utm_campaign=${affiliateTag}`;
  }
}
