import { ConfidenceCheckItem } from '../../../core/domain/ports/marketplaces/IMarketplaceAdapter';

/**
 * ProductPageScraper — Server-side HTML fetcher + link expander + metadata extractor.
 *
 * Performs:
 *  1. Link expansion & HTTP redirect tracking (e.g. s.shopee.com.br ➔ shopee.com.br/produto...)
 *  2. JSON-LD parsing (schema.org/Product)
 *  3. Open Graph meta tags (og:title, og:description, og:image, og:price:amount)
 *  4. Fallback extraction from expanded URL path slug
 *  5. Computes exact Confidence Score % (0 to 100) and Confidence Mode
 */
export interface RawProductMetadata {
  title: string;
  description: string;
  image: string;
  price: number | null;
  previousPrice: number | null;
  brand: string;
  category: string;
  subCategory?: string;
  rating?: number;
  reviewsCount?: number;
  salesCount?: string;
  shippingInfo?: string;
  couponInfo?: string;
  sellerName?: string;
  url: string;
  expandedUrl: string;
  confidenceScore: number; // 0 to 100
  confidenceMode: 'automatic' | 'assisted' | 'manual';
  confidenceItems: ConfidenceCheckItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeUrlString(rawUrl: string): string {
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

/**
 * Expands shortened affiliate links (s.shopee.com.br, shope.ee, amzn.to, etc.)
 * by following HTTP redirects to capture the real canonical product URL.
 */
export async function expandShortenedUrl(rawUrl: string): Promise<string> {
  const cleanUrl = normalizeUrlString(rawUrl);
  if (!cleanUrl) return rawUrl;

  const isShortener = /s\.shopee\.com\.br|shope\.ee|shp\.ee|amzn\.to|bit\.ly|tinyurl\.com|t\.co|ml\.br/i.test(cleanUrl);
  if (!isShortener) return cleanUrl;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4_000);

    const res = await fetch(cleanUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });

    clearTimeout(timeout);

    if (res.url && res.url !== cleanUrl) {
      console.log(`[LinkExpander] URL expandida: ${cleanUrl} ➔ ${res.url}`);
      return res.url;
    }
  } catch (err) {
    console.warn(`[LinkExpander] Falha ao expandir ${cleanUrl}:`, err);
  }

  return cleanUrl;
}

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return '';
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? decodeHtmlEntities(m[1].trim()) : '';
}

function parsePrice(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) || n <= 0 ? null : n;
}

function extractTitleFromUrlSlug(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/').filter(Boolean);
    const productSegment = parts.find((p) => p.includes('-') && !p.startsWith('MLB')) || parts[parts.length - 1] || '';
    
    // Clean Shopee / ML ID suffixes (-i.123.456)
    const cleaned = productSegment
      .replace(/-i\.\d+\.\d+$/i, '')
      .replace(/-MLB\d+$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/%[0-9A-F]{2}/gi, ' ')
      .trim();

    // Rejeitar slugs que sobraram como puramente numéricos
    if (/^\d+$/.test(cleaned)) return '';

    return cleaned.length > 3 ? cleaned : '';
  } catch {
    return '';
  }
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items: unknown[] = Array.isArray(parsed['@graph'] ?? parsed)
        ? (parsed['@graph'] ?? [parsed])
        : [parsed];
      for (const item of items as Record<string, unknown>[]) {
        if (
          typeof item === 'object' &&
          item !== null &&
          (item['@type'] === 'Product' || item['@type'] === 'Offer')
        ) {
          return item;
        }
      }
    } catch {
      // skip invalid JSON-LD
    }
  }
  return null;
}

function cleanTitle(title: string, marketplace: string): string {
  const cleaned = title
    .replace(/\s*[|\-–—]\s*(mercado\s*livre|amazon|shopee|magalu|magazine\s*luiza).*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || title;
}

function extractBrand(jsonLd: Record<string, unknown> | null, html: string): string {
  if (jsonLd?.brand) {
    const brand = jsonLd.brand as Record<string, unknown>;
    if (typeof brand === 'string') return brand;
    if (brand?.name) return String(brand.name);
  }
  const m = html.match(/["']brand["']\s*:\s*["']([^"']+)["']/i);
  return m ? m[1] : '';
}

function extractCategory(jsonLd: Record<string, unknown> | null, html: string): string {
  if (jsonLd?.category) return String(jsonLd.category);
  const m = html.match(/["']?category["'?\s]*:\s*["']([^"']+)["']/i);
  return m ? m[1] : '';
}

function extractPriceFromJsonLd(jsonLd: Record<string, unknown> | null): { current: number | null; previous: number | null } {
  if (!jsonLd) return { current: null, previous: null };
  if (jsonLd.price) return { current: parsePrice(String(jsonLd.price)), previous: null };
  const offers = jsonLd.offers as Record<string, unknown> | undefined;
  if (offers) {
    const price = parsePrice(String(offers.price ?? ''));
    return { current: price, previous: null };
  }
  return { current: null, previous: null };
}

// ─── Main Extractor ───────────────────────────────────────────────────────────

export async function fetchProductMetadata(url: string, marketplaceSlug: string): Promise<RawProductMetadata | null> {
  const cleanUrl = normalizeUrlString(url);
  if (!cleanUrl) return null;

  // 1. Expand shortened link
  const expandedUrl = await expandShortenedUrl(cleanUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000); // 6s timeout max

    const response = await fetch(expandedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeout);

    let html = '';
    if (response.ok) {
      html = await response.text();
    }

    const jsonLd = extractJsonLd(html);

    const ogTitle = extractMeta(html, 'og:title');
    const htmlTitle = extractTitle(html);
    const slugTitle = extractTitleFromUrlSlug(expandedUrl);

    let rawTitle = jsonLd?.name ? String(jsonLd.name) : (ogTitle || htmlTitle || slugTitle);

    if (/mkt\s*single\s*page|error_page|shopecdn/i.test(rawTitle)) {
      rawTitle = slugTitle || '';
    }

    const title = cleanTitle(rawTitle, marketplaceSlug);

    const ogDesc = extractMeta(html, 'og:description');
    const metaDesc = extractMeta(html, 'description');
    const jsonLdDesc = jsonLd?.description ? String(jsonLd.description) : '';
    const description = jsonLdDesc || ogDesc || metaDesc || '';

    const ogImage = extractMeta(html, 'og:image');
    const jsonLdImage = jsonLd?.image
      ? (Array.isArray(jsonLd.image) ? String(jsonLd.image[0]) : String(jsonLd.image))
      : '';
    const image = jsonLdImage || ogImage || '';

    const { current: jsonLdPrice, previous: jsonLdPrevPrice } = extractPriceFromJsonLd(jsonLd);
    const ogPrice = parsePrice(extractMeta(html, 'product:price:amount') || extractMeta(html, 'og:price:amount'));
    const price = jsonLdPrice ?? ogPrice;

    const brand = extractBrand(jsonLd, html);
    const category = extractCategory(jsonLd, html);

    // Calculate Confidence Items & Score %
    const items: ConfidenceCheckItem[] = [
      { label: 'Título oficial do anúncio', found: title.length > 3, weight: 30 },
      { label: 'Preço atual', found: price !== null && price > 0, weight: 25 },
      { label: 'Imagem principal do produto', found: image.length > 10, weight: 20 },
      { label: 'Categoria ou Marca', found: (category.length > 2 || brand.length > 2), weight: 15 },
      { label: 'Descrição / Detalhes', found: description.length > 10, weight: 10 },
    ];

    const score = items.reduce((acc, item) => acc + (item.found ? item.weight : 0), 0);

    // Determine Confidence Mode:
    // ≥ 80% ➔ automatic
    // 50% - 79% ➔ assisted (quick confirmation)
    // < 50% ➔ manual (full recovery screen)
    const mode: 'automatic' | 'assisted' | 'manual' =
      score >= 80 ? 'automatic' :
      score >= 50 ? 'assisted' : 'manual';

    return {
      title,
      description: description.slice(0, 500),
      image,
      price,
      previousPrice: jsonLdPrevPrice,
      brand,
      category,
      url: cleanUrl,
      expandedUrl,
      confidenceScore: score,
      confidenceMode: mode,
      confidenceItems: items,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Scraper] Exception fetching ${expandedUrl}:`, msg);
    const slugTitle = extractTitleFromUrlSlug(expandedUrl);

    return {
      title: slugTitle || '',
      description: `Link de produto recebido: ${cleanUrl}`,
      image: '',
      price: null,
      previousPrice: null,
      brand: '',
      category: '',
      url: cleanUrl,
      expandedUrl,
      confidenceScore: slugTitle ? 45 : 20,
      confidenceMode: slugTitle ? 'manual' : 'manual',
      confidenceItems: [
        { label: 'Título oficial do anúncio', found: !!slugTitle, weight: 30 },
        { label: 'Preço atual', found: false, weight: 25 },
        { label: 'Imagem principal do produto', found: false, weight: 20 },
        { label: 'Categoria ou Marca', found: false, weight: 15 },
        { label: 'Descrição / Detalhes', found: false, weight: 10 },
      ],
    };
  }
}
