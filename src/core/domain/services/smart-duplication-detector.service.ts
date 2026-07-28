import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { Product } from '../entities/product.entity';

export interface CandidateProductInput {
  url: string;
  title: string;
  image?: string;
  marketplace: string;
  currentPrice?: number | null;
}

export interface DuplicationCheckResult {
  isDuplicate: boolean;
  matchReason?: 'URL_NORMALIZADA' | 'ID_CANONICO' | 'IMAGEM' | 'TITULO_SEMELHANTE';
  existingProduct: Product | null;
}

/**
 * Normalizes a URL by stripping tracking parameters (utm_*, fbclid, ref, tag, gclid, etc.)
 */
export function normalizeProductUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl.trim());
    const paramsToKeep: string[] = [];

    // Keep product structural params like item / product ID if needed, but strip tracking
    parsed.searchParams.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (
        !lowerKey.startsWith('utm_') &&
        lowerKey !== 'fbclid' &&
        lowerKey !== 'gclid' &&
        lowerKey !== 'ref' &&
        lowerKey !== 'share_channel_code' &&
        lowerKey !== 'spm'
      ) {
        paramsToKeep.push(`${key}=${val}`);
      }
    });

    const cleanSearch = paramsToKeep.length > 0 ? `?${paramsToKeep.join('&')}` : '';
    return `${parsed.origin}${parsed.pathname}${cleanSearch}`.toLowerCase().replace(/\/$/, '');
  } catch {
    return rawUrl.trim().toLowerCase().replace(/\/$/, '');
  }
}

/**
 * Normalizes a title for fuzzy string comparison.
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, '') // remove special chars and whitespace
    .slice(0, 40);
}

export class SmartDuplicationDetectorService {
  /**
   * Checks if a candidate product already exists in the user's catalog.
   */
  public static async checkForDuplicate(
    candidate: CandidateProductInput,
    userId: string
  ): Promise<DuplicationCheckResult> {
    try {
      const repo = new FirestoreProductRepository();
      const existingProducts = await repo.findAll(userId);

      if (!existingProducts || existingProducts.length === 0) {
        return { isDuplicate: false, existingProduct: null };
      }

      const cleanCandidateUrl = normalizeProductUrl(candidate.url);
      const cleanCandidateTitle = normalizeTitle(candidate.title || '');

      for (const prod of existingProducts) {
        // 1. Check Normalized Original URL
        const cleanProdUrl = normalizeProductUrl(prod.originalUrl || '');
        if (cleanProdUrl && cleanCandidateUrl && cleanProdUrl === cleanCandidateUrl) {
          return {
            isDuplicate: true,
            matchReason: 'URL_NORMALIZADA',
            existingProduct: prod,
          };
        }

        // 2. Check Affiliate URL
        const cleanAffiliateUrl = normalizeProductUrl(prod.affiliateUrl?.url || '');
        if (cleanAffiliateUrl && cleanCandidateUrl && cleanAffiliateUrl === cleanCandidateUrl) {
          return {
            isDuplicate: true,
            matchReason: 'URL_NORMALIZADA',
            existingProduct: prod,
          };
        }

        // 3. Check Image Match
        if (candidate.image && prod.images && prod.images.includes(candidate.image)) {
          return {
            isDuplicate: true,
            matchReason: 'IMAGEM',
            existingProduct: prod,
          };
        }

        // 4. Check Title Similarity
        if (cleanCandidateTitle.length > 8) {
          const cleanProdTitle = normalizeTitle(prod.title || '');
          if (cleanProdTitle && cleanCandidateTitle === cleanProdTitle) {
            return {
              isDuplicate: true,
              matchReason: 'TITULO_SEMELHANTE',
              existingProduct: prod,
            };
          }
        }
      }

      return { isDuplicate: false, existingProduct: null };
    } catch (err) {
      console.warn('[SmartDuplicationDetectorService] Error checking duplicate:', err);
      return { isDuplicate: false, existingProduct: null };
    }
  }
}
