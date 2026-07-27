import { ProductExtractionResult } from '../../entities/ProductExtractionResult';

export interface ProviderExtractionResult {
  data: Partial<ProductExtractionResult> | null;
  providerName: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

export interface IProviderManager {
  extract(url: string, marketplaceSlug: string): Promise<ProviderExtractionResult>;
}
