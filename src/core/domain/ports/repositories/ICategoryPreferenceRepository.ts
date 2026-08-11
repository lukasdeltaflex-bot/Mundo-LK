import { CategoryPreference } from '../../entities/category-preference.entity';

export interface ICategoryPreferenceRepository {
  findByUserId(userId: string): Promise<CategoryPreference[]>;
  findMatching(userId: string, text: string): Promise<CategoryPreference | null>;
  save(preference: CategoryPreference): Promise<void>;
  recordCorrection(params: {
    userId: string;
    productTitle: string;
    targetCategoryId: string;
    targetCategoryName: string;
    targetSubcategoryId?: string | null;
    targetSubcategoryName?: string | null;
  }): Promise<CategoryPreference>;
}
