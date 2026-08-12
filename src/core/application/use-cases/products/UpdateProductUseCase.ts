import { IProductRepository } from '../../../domain/ports/repositories/IProductRepository';
import { Product } from '../../../domain/entities/product.entity';

export interface UpdateProductDTO {
  productId: string;
  userId: string;
  changes: Partial<Product>;
}

export class UpdateProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  public async execute(dto: UpdateProductDTO): Promise<Product> {
    const { productId, userId, changes } = dto;

    if (!productId) {
      throw new Error('[UpdateProductUseCase] ID do produto é obrigatório para atualização.');
    }

    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new Error(`[UpdateProductUseCase] Produto ${productId} não encontrado para atualização.`);
    }

    if (existingProduct.userId !== userId) {
      throw new Error('[UpdateProductUseCase] Operação não permitida: O produto pertence a outro usuário.');
    }

    if (this.productRepository.update) {
      await this.productRepository.update(productId, changes);
    } else {
      const updatedProduct = new Product({
        ...existingProduct,
        ...changes,
        id: existingProduct.id,
        userId: existingProduct.userId,
        createdAt: existingProduct.createdAt,
        updatedAt: new Date(),
      } as any);

      await this.productRepository.save(updatedProduct);
    }

    const refreshedProduct = await this.productRepository.findById(productId);
    return refreshedProduct || existingProduct;
  }
}
