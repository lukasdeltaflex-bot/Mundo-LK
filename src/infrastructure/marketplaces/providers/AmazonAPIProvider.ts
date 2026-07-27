import { ProductExtractionResult } from '../../../core/domain/entities/ProductExtractionResult';

export class AmazonAPIProvider {
  public async extract(url: string, _marketplaceSlug: string): Promise<Partial<ProductExtractionResult> | null> {
    // Optional Amazon PA-API integration if PAAPI credentials present in env
    const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
    if (!accessKey) {
      return null; // Skip to next provider in waterfall if no API key
    }
    return null;
  }
}
