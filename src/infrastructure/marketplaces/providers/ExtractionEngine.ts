import { ExtractedData } from '../../../core/domain/ports/marketplaces/IExtractionProvider';
import { IExtractionCacheRepository, ExtractionCacheDoc } from '../../../core/domain/ports/repositories/IExtractionCacheRepository';
import { expandShortenedUrl } from '../scraper/product-page-scraper';
import { MercadoLivreAPIProvider } from './MercadoLivreAPIProvider';
import { ZenRowsProvider } from './ZenRowsProvider';
import { IExtractionProvider } from '../../../core/domain/ports/marketplaces/IExtractionProvider';

export class ExtractionEngine {
  private providers: IExtractionProvider[];

  constructor(
    private cacheRepository: IExtractionCacheRepository
  ) {
    // Order of execution: Official APIs first, then Fallbacks
    this.providers = [
      new MercadoLivreAPIProvider(),
      new ZenRowsProvider(),
    ];
  }

  public async extract(rawUrl: string, marketplaceSlug: string): Promise<ExtractedData> {
    const startEngine = Date.now();
    console.log(`\n[Engine] 🚀 Iniciando extração para: ${rawUrl}`);

    // 1. Normalization & Expansion
    const startRouter = Date.now();
    const expandedUrl = await expandShortenedUrl(rawUrl);
    console.log(`[Router] ✅ Expansão concluída em ${Date.now() - startRouter}ms`);

    // 2. Cache Check
    const startCache = Date.now();
    const cached = await this.cacheRepository.findByUrl(expandedUrl);
    if (cached) {
      console.log(`[Cache] ⚡ Hit de cache em ${Date.now() - startCache}ms`);
      return this.mapCacheToExtractedData(cached);
    }
    console.log(`[Cache] ❌ Miss de cache em ${Date.now() - startCache}ms`);

    // 3. Provider Waterfall
    let finalData: ExtractedData | null = null;

    for (const provider of this.providers) {
      if (provider.canHandle(marketplaceSlug, expandedUrl)) {
        const startProvider = Date.now();
        const providerName = provider.constructor.name;
        console.log(`[Provider] 🔄 Tentando ${providerName}...`);
        
        finalData = await provider.extract(expandedUrl, marketplaceSlug);
        
        if (finalData && finalData.confidence >= 50) {
          console.log(`[Provider] ✅ Sucesso com ${providerName} em ${Date.now() - startProvider}ms. Score: ${finalData.confidence}%`);
          break;
        } else {
          console.log(`[Provider] ⚠️ ${providerName} falhou ou retornou baixa confiança. Avançando para o próximo fallback...`);
          finalData = null; // Reset to try next
        }
      }
    }

    // 4. Fallback final (se todos falharem)
    if (!finalData) {
      console.warn(`[Engine] ❌ Todos os provedores falharam para ${expandedUrl}.`);
      finalData = this.createEmptyFallback(expandedUrl, marketplaceSlug);
    }

    // 5. Salvar no Cache (se teve um mínimo de sucesso)
    if (finalData.confidence >= 50) {
      await this.saveToCache(finalData);
    }

    console.log(`[Engine] 🎉 Extração concluída em ${Date.now() - startEngine}ms. Confiança final: ${finalData.confidence}%\n`);
    return finalData;
  }

  private mapCacheToExtractedData(doc: ExtractionCacheDoc): ExtractedData {
    return {
      url: doc.url,
      normalizedUrl: doc.normalizedUrl,
      marketplace: doc.marketplace,
      productId: doc.productId,
      title: doc.title,
      description: doc.description,
      price: doc.price,
      oldPrice: doc.oldPrice,
      currency: doc.currency,
      discount: doc.discount,
      image: doc.image,
      images: doc.images,
      brand: doc.brand,
      category: doc.category,
      seller: doc.seller,
      rating: doc.rating,
      reviews: doc.reviews,
      sales: doc.sales,
      shipping: doc.shipping,
      coupon: doc.coupon,
      confidence: doc.confidence,
      source: `Cache (${doc.source})`,
    };
  }

  private async saveToCache(data: ExtractedData): Promise<void> {
    const start = Date.now();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6); // 6 hour TTL

    const doc: ExtractionCacheDoc = {
      ...data,
      id: Buffer.from(data.normalizedUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-20), // Simple ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.cacheRepository.save(doc);
    console.log(`[Firestore] ✅ Salvo no cache em ${Date.now() - start}ms`);
  }

  private createEmptyFallback(url: string, marketplaceSlug: string): ExtractedData {
    return {
      url,
      normalizedUrl: url,
      marketplace: marketplaceSlug,
      productId: '',
      title: '',
      description: '',
      price: null,
      oldPrice: null,
      currency: 'BRL',
      discount: 0,
      image: '',
      images: [],
      brand: '',
      category: '',
      seller: '',
      rating: 0,
      reviews: 0,
      sales: '',
      shipping: '',
      coupon: '',
      confidence: 0,
      source: 'Fallback',
    };
  }
}
