import { IProductRepository } from '../../../domain/ports/repositories/IProductRepository';
import { Product } from '../../../domain/entities/product.entity';

export class GetCatalogProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute(userId: string): Promise<Product[]> {
    return this.productRepository.findAll(userId);
  }
}
