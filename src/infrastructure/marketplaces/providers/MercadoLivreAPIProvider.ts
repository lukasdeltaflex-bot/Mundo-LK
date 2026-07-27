import { IExtractionProvider, ExtractedData } from '../../../core/domain/ports/marketplaces/IExtractionProvider';

export class MercadoLivreAPIProvider implements IExtractionProvider {
  public canHandle(marketplaceSlug: string, url: string): boolean {
    return marketplaceSlug === 'mercado-livre' || url.includes('mercadolivre.com.br');
  }

  public async extract(url: string, marketplaceSlug: string): Promise<ExtractedData | null> {
    const start = Date.now();
    try {
      const productId = this.extractMLB(url);
      if (!productId) {
        console.log(`[Provider:ML_API] Miss: URL não contém MLB ID explícito.`);
        return null; // Let fallback handle it
      }

      // Try hitting the public API directly
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      
      const res = await fetch(`https://api.mercadolibre.com/items/${productId}`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.log(`[Provider:ML_API] Falha HTTP ${res.status} em ${Date.now() - start}ms. API bloqueada ou ID inválido.`);
        return null; // Fallback to ZenRows
      }

      const data = await res.json();
      
      const price = data.price || null;
      const oldPrice = data.original_price || null;
      const discount = (oldPrice && price && oldPrice > price) 
        ? Math.round(((oldPrice - price) / oldPrice) * 100) 
        : 0;

      const result: ExtractedData = {
        url,
        normalizedUrl: url,
        marketplace: marketplaceSlug,
        productId,
        title: data.title || '',
        description: '', // Descrição exige outra chamada API (items/id/description), podemos pular por performance e deixar vazio
        price,
        oldPrice,
        currency: data.currency_id || 'BRL',
        discount,
        image: data.pictures?.[0]?.secure_url || data.thumbnail || '',
        images: data.pictures?.map((p: any) => p.secure_url) || [],
        brand: data.attributes?.find((a: any) => a.id === 'BRAND')?.value_name || '',
        category: data.category_id || '',
        seller: '', // Needs items/id/seller, omitting for now
        rating: 0,
        reviews: 0,
        sales: data.sold_quantity ? String(data.sold_quantity) : '',
        shipping: data.shipping?.free_shipping ? 'Frete Grátis' : '',
        coupon: '',
        confidence: 95, // Official API is high confidence
        source: 'ML_API',
      };

      console.log(`[Provider:ML_API] ⚡ Extração com sucesso em ${Date.now() - start}ms`);
      return result;

    } catch (error) {
      console.warn(`[Provider:ML_API] Exceção em ${Date.now() - start}ms:`, error);
      return null;
    }
  }

  private extractMLB(url: string): string | null {
    const m = url.match(/(MLB-?\d+)/i);
    return m ? m[1].replace('-', '') : null;
  }
}
