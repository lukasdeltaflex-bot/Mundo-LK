import { DiscoveryResult } from '../../../core/domain/entities/DiscoveryResult';

export class MagaluFeedDiscoverySource {
  public async fetchFromFeed(feedUrl?: string): Promise<DiscoveryResult[]> {
    if (!feedUrl || !feedUrl.trim()) {
      return [];
    }

    try {
      console.log(`[MagaluFeedDiscoverySource] 📡 Buscando feed de afiliados: ${feedUrl}`);
      const res = await fetch(feedUrl, {
        headers: {
          'Accept': 'application/json, application/xml, text/xml, */*',
        },
      });

      if (!res.ok) {
        console.warn(`[MagaluFeedDiscoverySource] HTTP status error: ${res.status}`);
        return [];
      }

      const text = await res.text();
      const results: DiscoveryResult[] = [];

      // Tenta parsear como JSON
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          const json = JSON.parse(text);
          const items = Array.isArray(json) ? json : (json.products || json.items || json.data || []);
          for (const item of items) {
            const title = item.title || item.name || '';
            const price = Number(item.price || item.currentPrice || item.final_price || 0);
            const image = item.image || item.imageUrl || item.mainImage || '';
            const url = item.url || item.link || item.originalUrl || '';

            if (title && price > 0 && image && url) {
              results.push(
                new DiscoveryResult({
                  title: title.trim(),
                  currentPrice: price,
                  previousPrice: item.oldPrice ? Number(item.oldPrice) : null,
                  image: image.trim(),
                  originalUrl: url.trim(),
                  marketplace: 'magalu',
                  marketplaceProductId: item.id || item.productId || null,
                  source: 'feed',
                  isValid: true,
                })
              );
            }
          }
        } catch (e) {
          console.warn(`[MagaluFeedDiscoverySource] Erro ao parsear JSON do feed:`, e);
        }
      }

      return results;
    } catch (err) {
      console.warn(`[MagaluFeedDiscoverySource] Falha na leitura do feed:`, err);
      return [];
    }
  }
}
