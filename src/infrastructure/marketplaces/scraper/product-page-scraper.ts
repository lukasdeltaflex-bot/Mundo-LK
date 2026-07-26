/**
 * ProductPageScraper — Server-side HTML fetcher + metadata extractor.
 *
 * Fetches the raw HTML of a product URL and extracts data from:
 *  1. JSON-LD structured data (schema.org/Product)
 *  2. Open Graph meta tags (og:title, og:description, og:image, og:price:amount)
 *  3. Twitter Card meta tags
 *  4. Common marketplace HTML patterns (title tag, price selectors)
 *
 * This runs exclusively in the Node.js server environment (server actions / API routes).
 * It handles errors gracefully and NEVER throws unhandled exceptions.
 */
export interface RawProductMetadata {
  title: string;
  description: string;
  image: string;
  price: number | null;
  previousPrice: number | null;
  brand: string;
  category: string;
  url: string;
  confidence: 'high' | 'medium' | 'low';
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

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000); // 6s timeout max

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Scraper] HTTP ${response.status} for ${cleanUrl}`);
      return null;
    }

    const html = await response.text();
    const jsonLd = extractJsonLd(html);

    const ogTitle = extractMeta(html, 'og:title');
    const htmlTitle = extractTitle(html);
    const rawTitle = jsonLd?.name ? String(jsonLd.name) : (ogTitle || htmlTitle);
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

    const hasTitle = title.length > 3;
    const hasPrice = price !== null;
    const hasJsonLd = jsonLd !== null;
    const confidence: 'high' | 'medium' | 'low' =
      hasTitle && hasPrice && hasJsonLd ? 'high' :
      hasTitle && (hasPrice || hasJsonLd) ? 'medium' : 'low';

    return {
      title,
      description: description.slice(0, 500),
      image,
      price,
      previousPrice: jsonLdPrevPrice,
      brand,
      category,
      url: cleanUrl,
      confidence,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Scraper] Exception fetching ${cleanUrl}:`, msg);
    return null;
  }
}
