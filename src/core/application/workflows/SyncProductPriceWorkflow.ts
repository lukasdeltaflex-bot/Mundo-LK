import { IProductRepository } from '../../domain/ports/repositories/IProductRepository';
import { IMarketplaceRegistry } from '../../domain/ports/marketplaces/IMarketplaceRegistry';
import { IDomainEventBus } from '../../domain/events/IDomainEventBus';
import { PriceChangedEvent } from '../../domain/events/PriceChangedEvent';
import { Price } from '../../domain/value-objects/price.vo';

export interface SyncProductPriceInputDTO {
  productId: string;
}

export interface SyncProductPriceOutputDTO {
  productId: string;
  priceChanged: boolean;
  oldPrice: number;
  newPrice: number;
}

/**
 * Workflow Engine: SyncProductPriceWorkflow.
 * Pure Application Layer Workflow for automatic price checking and alert generation.
 */
export class SyncProductPriceWorkflow {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly marketplaceRegistry: IMarketplaceRegistry,
    private readonly eventBus: IDomainEventBus
  ) {}

  public async execute(input: SyncProductPriceInputDTO): Promise<SyncProductPriceOutputDTO> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new Error(`Product not found: ${input.productId}`);
    }

    const adapter = this.marketplaceRegistry.getAdapterBySlug(product.marketplaceSlug);
    if (!adapter) {
      throw new Error(`Marketplace adapter not found for slug: ${product.marketplaceSlug}`);
    }

    const extracted = await adapter.extractProductData(product.originalUrl);
    const newPrice = Price.create(extracted.currentPrice);
    const oldPrice = product.currentPrice;

    const priceChanged = !oldPrice.equals(newPrice);

    if (priceChanged) {
      product.updatePrice(newPrice);
      await this.productRepository.save(product);
      await this.eventBus.publish(new PriceChangedEvent(product, oldPrice, newPrice));
    }

    return {
      productId: product.id,
      priceChanged,
      oldPrice: oldPrice.amount,
      newPrice: newPrice.amount,
    };
  }
}
