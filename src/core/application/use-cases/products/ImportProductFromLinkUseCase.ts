import { IMarketplaceRegistry } from '../../../domain/ports/marketplaces/IMarketplaceRegistry';
import { IProductRepository } from '../../../domain/ports/repositories/IProductRepository';
import { Product } from '../../../domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '../../../domain/value-objects';

export interface ImportProductInputDTO {
  url: string;
  userId: string;
  affiliateTag?: string;
}

export class ImportProductFromLinkUseCase {
  constructor(
    private readonly marketplaceRegistry: IMarketplaceRegistry,
    private readonly productRepository: IProductRepository
  ) {}

  public async execute(input: ImportProductInputDTO): Promise<Product> {
    const adapter = this.marketplaceRegistry.getAdapterForUrl(input.url);
    const extractedData = await adapter.extractProductData(input.url);

    const affiliateUrlString = await adapter.buildAffiliateLink(input.url, input.affiliateTag || 'default');
    const affiliateLink = AffiliateLink.create(affiliateUrlString);

    const currentPrice = Price.create(extractedData.currentPrice);
    const previousPrice = extractedData.previousPrice ? Price.create(extractedData.previousPrice) : null;
    const discountPercentage = DiscountPercentage.calculate(currentPrice, previousPrice);

    let product = await this.productRepository.findByOriginalUrl(extractedData.originalUrl);

    if (!product) {
      product = new Product({
        id: `prod_${Date.now()}_${Math.floor(performance.now() * 1000)}`,
        userId: input.userId,
        title: extractedData.title,
        description: extractedData.description,
        brand: extractedData.brand || 'Desconhecida',
        categoryId: 'general',
        marketplaceSlug: adapter.marketplaceSlug,
        originalUrl: extractedData.originalUrl,
        affiliateUrl: affiliateLink,
        currentPrice,
        previousPrice,
        discountPercentage,
        images: [extractedData.mainImage, ...(extractedData.gallery || [])],
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      product.updatePrice(currentPrice);
    }

    await this.productRepository.save(product);
    return product;
  }
}
