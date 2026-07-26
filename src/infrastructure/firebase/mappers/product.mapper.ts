import { Product } from '../../../core/domain/entities/product.entity';
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
  status: 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK' | 'TRASHED';
  publicationCount?: number;
  opportunityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export class ProductMapper {
  public static toDomain(doc: FirestoreProductDoc): Product {
    const currentPrice = Price.create(doc.currentPrice);
    const previousPrice = doc.previousPrice ? Price.create(doc.previousPrice) : null;
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
      status: doc.status,
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
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
