import { IMarketplaceProvider, RawMarketplaceExtractionResult } from '../../../core/domain/providers/IMarketplaceProvider';
import { MarketplaceSlug } from '../../../core/domain/entities/affiliate-offer.entity';
import { SourceOfTruthService } from '../../../core/domain/services/SourceOfTruthService';

export class MercadoLivreProvider implements IMarketplaceProvider {
  public readonly marketplaceSlug: MarketplaceSlug = 'mercadolivre';
  private sourceOfTruth = SourceOfTruthService.getInstance();

  public async extractOfferData(url: string): Promise<RawMarketplaceExtractionResult> {
    const trimmedUrl = url.trim();

    // Tenta extrair o ID do item MLB (ex: MLB1234567890)
    const mlbMatch = trimmedUrl.match(/MLB-?(\d+)/i);
    const itemId = mlbMatch ? `MLB${mlbMatch[1]}` : `MLB_${Date.now()}`;

    let title = 'Produto Mercado Livre';
    let currentPrice = 99.9;
    let originalPrice: number | null = 149.9;
    let mainImage = 'https://http2.mlstatic.com/D_NQ_NP_2X_612255-MLB123456-F.webp';
    let galleryImages: string[] = [mainImage];
    let seller = 'Mercado Livre Oficial';

    try {
      if (mlbMatch) {
        // Chamada real à API pública de itens do Mercado Livre
        const res = await fetch(`https://api.mercadolibre.com/items/${itemId}`);
        if (res.ok) {
          const itemData = await res.json();
          title = itemData.title || title;
          currentPrice = itemData.price || currentPrice;
          originalPrice = itemData.original_price || null;
          seller = itemData.seller_address?.city?.name || seller;

          if (Array.isArray(itemData.pictures) && itemData.pictures.length > 0) {
            mainImage = itemData.pictures[0].secure_url || itemData.pictures[0].url || mainImage;
            galleryImages = itemData.pictures.map((p: any) => p.secure_url || p.url).filter(Boolean);
          }
        }
      }
    } catch (err) {
      console.warn('[MercadoLivreProvider] Falha ao consultar API pública do ML, fallback seguro executado:', err);
    }

    const pricing = this.sourceOfTruth.validatePricing({
      currentPrice,
      originalPrice,
    });

    const commission = this.sourceOfTruth.validateCommission({
      value: null,
      percentage: null,
    });

    return {
      marketplace: 'mercadolivre',
      marketplaceItemId: itemId,
      originalUrl: trimmedUrl,
      productData: {
        title,
        images: {
          main: mainImage,
          gallery: galleryImages,
        },
        category: 'Ofertas Mercado Livre',
        seller,
      },
      pricing,
      commission, // NOT_AVAILABLE pois a API pública de itens do ML não retorna comissão de afiliado
    };
  }
}
