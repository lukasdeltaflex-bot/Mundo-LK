import { ExtractedData } from '../../../core/domain/ports/marketplaces/IExtractionProvider';

export function extractProductDataFromHtml(html: string, url: string, marketplaceSlug: string): Omit<ExtractedData, 'source'> {
  const start = Date.now();
  console.log(`[Parser] 🕵️‍♂️ Iniciando parsing do HTML...`);

  const jsonLd = extractJsonLd(html);
  
  const ogTitle = extractMeta(html, 'og:title');
  const htmlTitle = extractHtmlTitle(html);
  const slugTitle = extractTitleFromUrlSlug(url);

  let rawTitle = jsonLd?.name ? String(jsonLd.name) : (ogTitle || htmlTitle || slugTitle);
  if (/mkt\s*single\s*page|error_page|shopecdn/i.test(rawTitle)) {
    rawTitle = slugTitle || '';
  }
  const title = cleanTitle(rawTitle, marketplaceSlug);

  const description = String(jsonLd?.description || extractMeta(html, 'og:description') || extractMeta(html, 'description') || '').slice(0, 500);
  
  const ogImage = extractMeta(html, 'og:image');
  const image = String((Array.isArray(jsonLd?.image) ? jsonLd.image[0] : jsonLd?.image) || ogImage || '');

  const { current: jsonLdPrice, previous: jsonLdPrevPrice } = extractPriceFromJsonLd(jsonLd);
  const ogPrice = parsePrice(extractMeta(html, 'product:price:amount') || extractMeta(html, 'og:price:amount'));
  const htmlPrice = extractHtmlPrice(html);
  const price = jsonLdPrice ?? ogPrice ?? htmlPrice;

  const brand = extractBrand(jsonLd, html);
  const category = extractCategory(jsonLd, html);

  const confidence = calculateConfidence(title, price, image, category);
  
  console.log(`[Parser] ✅ Parsing finalizado em ${Date.now() - start}ms. Score: ${confidence}%`);

  return {
    url,
    normalizedUrl: url,
    marketplace: marketplaceSlug,
    productId: extractTitleFromUrlSlug(url) || `id_${Date.now()}`,
    title,
    description,
    price,
    oldPrice: jsonLdPrevPrice,
    currency: 'BRL',
    discount: (jsonLdPrevPrice && price && jsonLdPrevPrice > price) ? Math.round(((jsonLdPrevPrice - price) / jsonLdPrevPrice) * 100) : 0,
    image,
    images: image ? [image] : [],
    brand,
    category,
    seller: '',
    rating: 0,
    reviews: 0,
    sales: '',
    shipping: '',
    coupon: '',
    confidence
  };
}

// Helpers
function extractHtmlTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
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
    if (m?.[1]) return m[1].trim();
  }
  return '';
}

function parsePrice(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) || n <= 0 ? null : n;
}

function extractHtmlPrice(html: string): number | null {
  if (!html) return null;

  // 1. Check itemprop="price"
  const itempropMatch = html.match(/itemprop=["']price["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/content=["']([^"']+)["'][^>]+itemprop=["']price["']/i);
  if (itempropMatch?.[1]) {
    const p = parsePrice(itempropMatch[1]);
    if (p) return p;
  }

  // 2. Check Mercado Livre / e-commerce price fraction tag
  const mlPriceMatch = html.match(/class=["'][^"']*price-tag-fraction[^"']*["'][^>]*>(\d+)<\/span>/i);
  if (mlPriceMatch?.[1]) {
    const p = parsePrice(mlPriceMatch[1]);
    if (p) return p;
  }

  // 3. Check JSON embedding patterns (e.g. "price": 199.90 or "price": "199.90")
  const jsonPriceMatch = html.match(/["']price["']\s*:\s*["']?(\d+(?:\.\d{1,2})?)["']?/i);
  if (jsonPriceMatch?.[1]) {
    const p = parsePrice(jsonPriceMatch[1]);
    if (p) return p;
  }

  return null;
}

function extractTitleFromUrlSlug(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/').filter(Boolean);
    const productSegment = parts.find((p) => p.includes('-') && !p.startsWith('MLB')) || parts[parts.length - 1] || '';
    const cleaned = productSegment.replace(/-i\.\d+\.\d+$/i, '').replace(/-MLB\d+$/i, '').replace(/[-_]+/g, ' ').replace(/%[0-9A-F]{2}/gi, ' ').trim();
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
      const items = Array.isArray(parsed['@graph'] ?? parsed) ? (parsed['@graph'] ?? [parsed]) : [parsed];
      for (const item of items) {
        if (typeof item === 'object' && item !== null && (item['@type'] === 'Product' || item['@type'] === 'Offer')) {
          return item as Record<string, unknown>;
        }
      }
    } catch {}
  }
  return null;
}

function extractPriceFromJsonLd(jsonLd: Record<string, unknown> | null): { current: number | null; previous: number | null } {
  if (!jsonLd) return { current: null, previous: null };
  if (jsonLd.price) return { current: parsePrice(String(jsonLd.price)), previous: null };
  const offers = jsonLd.offers as any;
  if (offers) {
    const price = parsePrice(String(offers.price ?? ''));
    return { current: price, previous: null };
  }
  return { current: null, previous: null };
}

function cleanTitle(title: string, marketplace: string): string {
  return title.replace(/\s*[|\-–—]\s*(mercado\s*livre|amazon|shopee|magalu|magazine\s*luiza).*/i, '').replace(/\s+/g, ' ').trim() || title;
}

function extractBrand(jsonLd: Record<string, unknown> | null, html: string): string {
  if (jsonLd?.brand) {
    const brand = jsonLd.brand as any;
    if (typeof brand === 'string') return brand;
    if (brand?.name) return String(brand.name);
  }
  return extractMeta(html, 'brand') || '';
}

function extractCategory(jsonLd: Record<string, unknown> | null, html: string): string {
  if (jsonLd?.category) return String(jsonLd.category);
  return extractMeta(html, 'category') || '';
}

function calculateConfidence(title: string, price: number | null, image: string, category: string): number {
  let score = 0;
  if (title.length > 3) score += 40;
  if (price !== null && price > 0) score += 30;
  if (image.length > 10) score += 20;
  if (category.length > 2) score += 10;
  return score;
}
