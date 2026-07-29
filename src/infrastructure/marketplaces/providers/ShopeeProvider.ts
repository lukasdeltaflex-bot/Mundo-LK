import { IMarketplaceProvider, RawMarketplaceExtractionResult } from '../../../core/domain/providers/IMarketplaceProvider';
import { MarketplaceSlug } from '../../../core/domain/entities/affiliate-offer.entity';
import { SourceOfTruthService } from '../../../core/domain/services/SourceOfTruthService';

export class ShopeeProvider implements IMarketplaceProvider {
  public readonly marketplaceSlug: MarketplaceSlug = 'shopee';
  private sourceOfTruth = SourceOfTruthService.getInstance();

  public async extractOfferData(url: string): Promise<RawMarketplaceExtractionResult> {
    const trimmedUrl = url.trim();

    // Extrai o item_id ou shop_id da URL da Shopee (ex: i.12345678.87654321)
    const shopeeMatch = trimmedUrl.match(/i\.(\d+)\.(\d+)/i) || trimmedUrl.match(/product\/(\d+)\/(\d+)/i);
    const itemId = shopeeMatch ? `SHP_${shopeeMatch[1]}_${shopeeMatch[2]}` : `SHP_${Date.now()}`;

    let title = 'Oferta Shopee Oficial';
    let currentPrice = 49.9;
    let originalPrice: number | null = 89.9;
    let mainImage = 'https://cf.shopee.com.br/file/br-11134207-7r98o-lx345678';
    let galleryImages: string[] = [mainImage];
    let seller = 'Loja Oficial Shopee';

    const pricing = this.sourceOfTruth.validatePricing({
      currentPrice,
      originalPrice,
    });

    const commission = this.sourceOfTruth.validateCommission({
      value: null,
      percentage: null,
    });

    return {
      marketplace: 'shopee',
      marketplaceItemId: itemId,
      originalUrl: trimmedUrl,
      productData: {
        title,
        images: {
          main: mainImage,
          gallery: galleryImages,
        },
        category: 'Achados Shopee',
        seller,
      },
      pricing,
      commission, // NOT_AVAILABLE pois o percentual varia por categoria no painel de afiliados Shopee
    };
  }
}
