import { IAffiliateDiscoveryProvider, DiscoveryOptions } from '../../../core/domain/ports/marketplaces/IAffiliateDiscoveryProvider';
import { DiscoveryResult } from '../../../core/domain/entities/DiscoveryResult';
import { MagaluFeedDiscoverySource } from './MagaluFeedDiscoverySource';
import { MagaluPublicDiscoverySource } from './MagaluPublicDiscoverySource';
import { MagaluAdapter } from '../adapters/magalu.adapter';

export class MagaluDiscoveryProvider implements IAffiliateDiscoveryProvider {
  public readonly marketplaceSlug = 'magalu';
  public readonly marketplaceName = 'Magazine Luiza';

  private feedSource = new MagaluFeedDiscoverySource();
  private publicSource = new MagaluPublicDiscoverySource();
  private magaluAdapter = new MagaluAdapter();

  public async discover(options?: DiscoveryOptions): Promise<DiscoveryResult[]> {
    const limit = options?.limit || 20;
    const candidates: DiscoveryResult[] = [];

    // 1. Se houver feedUrl fornecida, busca no feed de afiliados primeiro
    if (options?.feedUrl) {
      const feedItems = await this.feedSource.fetchFromFeed(options.feedUrl);
      candidates.push(...feedItems);
    }

    // 2. Se a lista de candidatos for menor que o limite, busca na fonte pública
    if (candidates.length < limit) {
      const publicItems = await this.publicSource.discoverDeals(limit - candidates.length);
      candidates.push(...publicItems);
    }

    // 3. Validação objetiva e deduplicação
    const validCandidates: DiscoveryResult[] = [];
    const seenUrls = new Set<string>();

    for (const c of candidates) {
      if (validCandidates.length >= limit) break;

      const cleanUrl = c.originalUrl.split('?')[0];
      if (seenUrls.has(cleanUrl)) continue;
      seenUrls.add(cleanUrl);

      // Validação estrita dos campos obrigatórios
      const hasTitle = Boolean(c.title && c.title.trim().length > 3);
      const hasUrl = Boolean(c.originalUrl && c.originalUrl.includes('magazineluiza.com.br'));

      if (hasTitle && hasUrl) {
        // Enriquece o candidato via MagaluAdapter se preço/imagem estiverem zerados
        if (c.currentPrice === 0 || !c.image) {
          try {
            const enriched = await this.magaluAdapter.extractProductData(c.originalUrl);
            if (enriched && enriched.currentPrice > 0) {
              validCandidates.push(
                new DiscoveryResult({
                  title: enriched.title || c.title,
                  currentPrice: enriched.currentPrice,
                  previousPrice: enriched.previousPrice,
                  image: enriched.mainImage || c.image,
                  originalUrl: c.originalUrl,
                  marketplace: 'magalu',
                  marketplaceProductId: c.marketplaceProductId,
                  source: c.source,
                  isValid: true,
                })
              );
              continue;
            }
          } catch (err) {
            console.warn(`[MagaluDiscoveryProvider] Erro no enriquecimento do candidato:`, err);
          }
        }

        validCandidates.push(c);
      }
    }

    console.log(`[MagaluDiscoveryProvider] 🎯 Retornando ${validCandidates.length} candidatos reais validados.`);
    return validCandidates;
  }
}
