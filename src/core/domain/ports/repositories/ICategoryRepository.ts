import { ManagedCategory } from '../../entities/managed-category.entity';

export interface ICategoryRepository {
  findById(id: string): Promise<ManagedCategory | null>;
  findAll(userId: string): Promise<ManagedCategory[]>;
  save(category: ManagedCategory): Promise<void>;
  saveBatch(categories: ManagedCategory[]): Promise<void>;
  delete(id: string): Promise<void>;
  seedDefaultsIfEmpty(userId: string): Promise<ManagedCategory[]>;
}
