import { Product, DispatchRecord, CategorySource, ProductMedia } from '../../../core/domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '../../../core/domain/value-objects';

export interface FirestoreProductDoc {
  id: string;
  userId: string;
  title: string;
  description: string;
  brand: string;
  categoryId: string;
  marketplaceSlug: string;
  originalUrl: string;
  affiliateUrl: string;
  currentPrice: number;
  previousPrice?: number | null;
  discountPercentage: number;
  images: string[];
  media?: ProductMedia[];
  status: 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK' | 'TRASHED';
  publicationCount?: number;
  opportunityScore?: number;

  // Categorization Persistence Fields
  subcategoryId?: string | null;
  categorySource?: CategorySource | null;
  categoryConfidence?: number | null;
  categoryLocked?: boolean;
  categoryUpdatedAt?: string | null;
  categoryReasoning?: string | null;

  // Dispatch Tracking Persistence Fields
  dispatchCount?: number;
  firstDispatchedAt?: string | null;
  lastDispatchedAt?: string | null;
  lastChannel?: string | null;
  dispatchHistory?: DispatchRecord[];

  createdAt: string;
  updatedAt: string;
}

export class ProductMapper {
  public static toDomain(doc: FirestoreProductDoc): Product {
    const parsePriceNumber = (raw: any): number => {
      if (typeof raw === 'number') return raw;
      if (typeof raw === 'string') return parseFloat(raw) || 0;
      if (raw && typeof raw === 'object' && typeof raw.amount === 'number') return raw.amount;
      return 0;
    };

    const currentPrice = Price.create(parsePriceNumber(doc.currentPrice));
    const previousPrice = doc.previousPrice ? Price.create(parsePriceNumber(doc.previousPrice)) : null;
    const discountPercentage = DiscountPercentage.calculate(currentPrice, previousPrice);
    const affiliateUrl = AffiliateLink.create(doc.affiliateUrl);

    return new Product({
      id: doc.id,
      userId: doc.userId,
      title: doc.title,
      description: doc.description,
      brand: doc.brand,
      categoryId: doc.categoryId,
      marketplaceSlug: doc.marketplaceSlug,
      originalUrl: doc.originalUrl,
      affiliateUrl,
      currentPrice,
      previousPrice,
      discountPercentage,
      images: doc.images || [],
      media: doc.media || undefined,
      status: doc.status,

      subcategoryId: doc.subcategoryId || null,
      categorySource: doc.categorySource || null,
      categoryConfidence: doc.categoryConfidence ?? null,
      categoryLocked: doc.categoryLocked ?? false,
      categoryUpdatedAt: doc.categoryUpdatedAt ? new Date(doc.categoryUpdatedAt) : null,
      categoryReasoning: doc.categoryReasoning || null,

      dispatchCount: doc.dispatchCount ?? 0,
      firstDispatchedAt: doc.firstDispatchedAt ? new Date(doc.firstDispatchedAt) : null,
      lastDispatchedAt: doc.lastDispatchedAt ? new Date(doc.lastDispatchedAt) : null,
      lastChannel: doc.lastChannel || null,
      dispatchHistory: Array.isArray(doc.dispatchHistory) ? doc.dispatchHistory : [],

      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }

  public static toPersistence(entity: Product): FirestoreProductDoc {
    return {
      id: entity.id,
      userId: entity.userId,
      title: entity.title,
      description: entity.description,
      brand: entity.brand,
      categoryId: entity.categoryId,
      marketplaceSlug: entity.marketplaceSlug,
      originalUrl: entity.originalUrl,
      affiliateUrl: entity.affiliateUrl.url,
      currentPrice: entity.currentPrice.amount,
      previousPrice: entity.previousPrice ? entity.previousPrice.amount : null,
      discountPercentage: entity.discountPercentage.value,
      images: entity.images,
      media: entity.media || [],
      status: entity.status,

      subcategoryId: entity.subcategoryId || null,
      categorySource: entity.categorySource || null,
      categoryConfidence: entity.categoryConfidence ?? null,
      categoryLocked: entity.categoryLocked ?? false,
      categoryUpdatedAt: entity.categoryUpdatedAt ? entity.categoryUpdatedAt.toISOString() : null,
      categoryReasoning: entity.categoryReasoning || null,

      dispatchCount: entity.dispatchCount || 0,
      firstDispatchedAt: entity.firstDispatchedAt ? entity.firstDispatchedAt.toISOString() : null,
      lastDispatchedAt: entity.lastDispatchedAt ? entity.lastDispatchedAt.toISOString() : null,
      lastChannel: entity.lastChannel || null,
      dispatchHistory: entity.dispatchHistory || [],

      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
