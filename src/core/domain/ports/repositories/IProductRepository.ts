import { Product } from '../../entities/product.entity';

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findByOriginalUrl(url: string): Promise<Product | null>;
  findAll(userId: string): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
