import { DiscoveryResult } from '../../../core/domain/entities/DiscoveryResult';

export class MagaluPublicDiscoverySource {
  private targetUrl = 'https://www.magazineluiza.com.br/selecao/ofertas-do-dia/';

  public async discoverDeals(limit = 20): Promise<DiscoveryResult[]> {
    try {
      console.log(`[MagaluPublicDiscoverySource] 🔍 Buscando ofertas em alta em: ${this.targetUrl}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(this.targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[MagaluPublicDiscoverySource] HTTP Status não OK: ${res.status}`);
        return [];
      }

      const html = await res.text();
      const results: DiscoveryResult[] = [];

      // Regex para extrair blocos de produtos com data-testid="product-card" ou links de produtos
      // Padrão Magalu: href="/p/{slug}/{productId}/" ou href="/{slug}/p/{productId}/"
      const productLinkRegex = /href="(\/(?:[^\/]+\/)*p\/[^\/]+\/[^"\?]+)"/gi;
      const matches = Array.from(html.matchAll(productLinkRegex));
      
      const seenUrls = new Set<string>();

      for (const match of matches) {
        if (results.length >= limit) break;

        let relativeUrl = match[1];
        if (!relativeUrl.startsWith('http')) {
          relativeUrl = `https://www.magazineluiza.com.br${relativeUrl}`;
        }

        const cleanUrl = relativeUrl.split('?')[0];
        if (seenUrls.has(cleanUrl)) continue;
        seenUrls.add(cleanUrl);

        // Extrai o ID do produto da URL (ex: magazineluiza.com.br/produto/p/2345678/...)
        const idMatch = cleanUrl.match(/\/p\/([a-zA-Z0-9]+)/);
        const productId = idMatch ? idMatch[1] : null;

        // Tenta encontrar o título a partir do slug do link se o HTML for denso
        const slugMatch = cleanUrl.match(/\/([a-z0-9-]+)\/p\//);
        const rawSlug = slugMatch ? slugMatch[1].replace(/-/g, ' ') : '';
        const titleCandidate = rawSlug ? rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1) : '';

        if (titleCandidate && titleCandidate.length > 5) {
          results.push(
            new DiscoveryResult({
              title: titleCandidate,
              currentPrice: 0, // Será enriquecido pelo MagaluAdapter na seleção
              previousPrice: null,
              image: 'https://a-static.mlcdn.com.br/618x463/produto/2345678.jpg',
              originalUrl: cleanUrl,
              marketplace: 'magalu',
              marketplaceProductId: productId,
              source: 'public_deals',
              isValid: true,
            })
          );
        }
      }

      console.log(`[MagaluPublicDiscoverySource] ✅ Descobertos ${results.length} candidatos reais.`);
      return results;
    } catch (err) {
      console.warn(`[MagaluPublicDiscoverySource] Falha ao varrer fonte pública do Magalu:`, err);
      return [];
    }
  }
}
