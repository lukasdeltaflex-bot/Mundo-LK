import { IMarketplaceAdapter, ExtractedProductData } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';
import { fetchProductMetadata, expandShortenedUrl } from '../scraper/product-page-scraper';

/**
 * Adapter for Shopee Marketplace.
 *
 * CAMADA PIPELINE:
 *  L1 → Expandir links encurtados (s.shopee.com.br, shope.ee, shp.ee)
 *  L2 → Shopee Internal API /api/v4/item/get (extrair shopId + itemId da URL)
 *  L3 → HTML/JSON-LD scraping via fetchProductMetadata (Shopee bloqueia bastante)
 *  L4 → URL slug fallback → score < 50 → Modo Manual
 */
export class ShopeeAdapter implements IMarketplaceAdapter {
  public readonly marketplaceSlug: string = 'shopee';
  public readonly marketplaceName: string = 'Shopee Brasil';

  public canHandle(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.includes('shopee.com.br') ||
      lower.includes('shope.ee') ||
      lower.includes('shp.ee') ||
      lower.includes('s.shopee.com.br')
    );
  }

  public async extractProductData(url: string): Promise<ExtractedProductData> {
    // L1: Expand shortened link to get canonical URL
    const expandedUrl = await expandShortenedUrl(url.trim());
    console.log(`[Shopee] URL expandida: ${expandedUrl}`);

    // L2: Try Shopee internal API (only works after link expansion)
    const ids = this.extractShopeeIds(expandedUrl);
    if (ids) {
      try {
        const apiResult = await this.fetchFromShopeeApi(ids.shopId, ids.itemId, expandedUrl);
        if (apiResult && apiResult.title && apiResult.title.length > 5) {
          console.log(`[Shopee-API] Dados obtidos via API interna para shopId=${ids.shopId} itemId=${ids.itemId}`);
          return apiResult;
        }
      } catch (err) {
        console.warn('[Shopee-API] Falha na API interna, tentando scraping HTML:', err);
      }
    }

    // L3: HTML/JSON-LD scraping
    const metadata = await fetchProductMetadata(expandedUrl, this.marketplaceSlug);
    const hasValidTitle = metadata && metadata.title.length > 5 &&
      !/mkt\s*single\s*page|error_page|shopecdn/i.test(metadata.title);

    if (hasValidTitle && metadata) {
      return {
        title:           metadata.title,
        description:     metadata.description || `Produto disponível na ${this.marketplaceName}.`,
        brand:           metadata.brand || 'Desconhecida',
        categoryName:    metadata.category || 'Geral',
        mainImage:       metadata.image || '',
        gallery:         metadata.image ? [metadata.image] : [],
        currentPrice:    metadata.price ?? 0,
        previousPrice:   metadata.previousPrice ?? null,
        storeName:       this.marketplaceName,
        storeReputation: 'Loja Shopee',
        shippingInfo:    'Frete Shopee (Verificar condições)',
        originalUrl:     expandedUrl,
        confidenceScore: metadata.confidenceScore,
        confidenceMode:  metadata.confidenceMode,
        confidenceItems: metadata.confidenceItems,
      };
    }

    // L4: Slug fallback — low confidence, triggers manual/assisted recovery screen
    const rawSlug = metadata?.title || '';
    // Rejeitar títulos que sejam puramente numéricos (itemId/shopId, não nomes reais)
    const slugTitle = /^\d+$/.test(rawSlug.trim()) ? '' : rawSlug;
    const score = slugTitle.length > 3 ? 45 : 20;
    return {
      title:           slugTitle,
      description:     '',
      brand:           '',
      categoryName:    'Geral',
      mainImage:       '',
      gallery:         [],
      currentPrice:    0,
      previousPrice:   null,
      storeName:       this.marketplaceName,
      storeReputation: 'Loja Shopee',
      shippingInfo:    'Frete Shopee',
      originalUrl:     expandedUrl,
      confidenceScore: score,
      confidenceMode:  'manual',
      confidenceItems: [
        { label: 'Título oficial do anúncio', found: slugTitle.length > 3, weight: 30 },
        { label: 'Preço atual', found: false, weight: 25 },
        { label: 'Imagem principal do produto', found: false, weight: 20 },
        { label: 'Categoria ou Marca', found: false, weight: 15 },
        { label: 'Descrição / Detalhes', found: false, weight: 10 },
      ],
    };
  }

  // ── Layer 2: Shopee Internal API ─────────────────────────────────────────────

  /**
   * Extract shopId and itemId from canonical Shopee URL.
   * Pattern: shopee.com.br/{slug}/i.{shopId}.{itemId}
   * or:      shopee.com.br/product/{shopId}/{itemId}
   */
  private extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
    // Format 1: .../i.{shopId}.{itemId}
    const m1 = url.match(/\.i\.(\d+)\.(\d+)/);
    if (m1) return { shopId: m1[1], itemId: m1[2] };

    // Format 2: /product/{shopId}/{itemId}
    const m2 = url.match(/\/product\/(\d+)\/(\d+)/);
    if (m2) return { shopId: m2[1], itemId: m2[2] };

    return null;
  }

  private async fetchFromShopeeApi(shopId: string, itemId: string, originalUrl: string): Promise<ExtractedProductData | null> {
    const endpoint = `https://shopee.com.br/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent':  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':      'application/json',
        'Referer':     `https://shopee.com.br/`,
        'x-api-source': 'pc',
        'x-shopee-language': 'pt',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const json = await res.json() as Record<string, unknown>;
    const data = (json as Record<string, Record<string, unknown>>)['data'];
    if (!data) return null;

    const name = String(data['name'] || '');
    if (!name) return null;

    const price = typeof data['price'] === 'number' ? data['price'] / 100000 : null;
    const originalPrice = typeof data['price_before_discount'] === 'number' && (data['price_before_discount'] as number) > 0
      ? (data['price_before_discount'] as number) / 100000
      : null;
    const images = (data['images'] as string[] | undefined) || [];
    const mainImage = images[0] ? `https://cf.shopee.com.br/file/${images[0]}` : '';
    const description = String(data['description'] || '').slice(0, 2000);
    const categoryName = String(data['category'] || '');
    const rating = typeof data['item_rating'] === 'object' && data['item_rating'] !== null
      ? Number((data['item_rating'] as Record<string, unknown>)['rating_star']) || 0
      : 0;

    // Extração inteligente de atributos da Shopee
    const rawAttrs = Array.isArray(data['attributes']) ? (data['attributes'] as Array<Record<string, unknown>>) : [];
    const extractedAttributes: Record<string, string> = {};
    let extractedBrand = '';

    for (const attr of rawAttrs) {
      const attrName = String(attr['name'] || '').trim();
      const attrVal = String(attr['value'] || '').trim();
      if (attrName && attrVal) {
        extractedAttributes[attrName] = attrVal;
        if (attrName.toLowerCase().includes('marca') || attrName.toLowerCase().includes('brand')) {
          extractedBrand = attrVal;
        }
      }
    }

    const checkItems: Array<{ label: string; found: boolean; weight: number }> = [
      { label: 'Título oficial do anúncio', found: name.length > 5, weight: 30 },
      { label: 'Preço atual', found: price !== null && price > 0, weight: 25 },
      { label: 'Imagem principal do produto', found: !!mainImage, weight: 20 },
      { label: 'Categoria ou Marca', found: !!categoryName || !!extractedBrand, weight: 15 },
      { label: 'Descrição / Detalhes', found: description.length > 10, weight: 10 },
    ];
    const score = checkItems.reduce((a, i) => a + (i.found ? i.weight : 0), 0);
    const mode: 'automatic' | 'assisted' | 'manual' = score >= 80 ? 'automatic' : score >= 50 ? 'assisted' : 'manual';

    return {
      title:           name,
      description,
      brand:           extractedBrand,
      categoryName:    categoryName || 'Geral',
      mainImage,
      gallery:         images.slice(0, 5).map((img) => `https://cf.shopee.com.br/file/${img}`),
      currentPrice:    price ?? 0,
      previousPrice:   originalPrice && originalPrice > (price ?? 0) ? originalPrice : null,
      reviewsRating:   rating,
      storeName:       this.marketplaceName,
      storeReputation: 'Loja Shopee',
      shippingInfo:    'Frete Shopee (Verificar condições)',
      originalUrl:     originalUrl,
      confidenceScore: score,
      confidenceMode:  mode,
      confidenceItems: checkItems,
      attributes:      Object.keys(extractedAttributes).length > 0 ? extractedAttributes : undefined,
    };
  }

  public async buildAffiliateLink(originalUrl: string, affiliateTag: string): Promise<string> {
    const cleanUrl = originalUrl.split('?')[0];
    if (!affiliateTag) return cleanUrl;
    return `${cleanUrl}?utm_source=affiliate&af_siteid=${affiliateTag}&af_click_lookback=7d`;
  }
}
