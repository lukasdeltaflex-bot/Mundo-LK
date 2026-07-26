import { Price, DiscountPercentage, AffiliateLink } from '../value-objects';

export type ProductStatus = 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK' | 'TRASHED';

export interface ProductProps {
  id: string;
  userId: string;
  title: string;
  description: string;
  brand: string;
  categoryId: string;
  marketplaceSlug: string;
  originalUrl: string;
  affiliateUrl: AffiliateLink;
  currentPrice: Price;
  previousPrice?: Price | null;
  discountPercentage: DiscountPercentage;
  images: string[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pure Domain Entity representing an Affiliate Product.
 * Independent of frameworks or database models.
 */
export class Product {
  public readonly id: string;
  public readonly userId: string;
  public title: string;
  public description: string;
  public brand: string;
  public categoryId: string;
  public readonly marketplaceSlug: string;
  public readonly originalUrl: string;
  public affiliateUrl: AffiliateLink;
  public currentPrice: Price;
  public previousPrice?: Price | null;
  public discountPercentage: DiscountPercentage;
  public images: string[];
  public status: ProductStatus;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: ProductProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.title = props.title;
    this.description = props.description;
    this.brand = props.brand;
    this.categoryId = props.categoryId;
    this.marketplaceSlug = props.marketplaceSlug;
    this.originalUrl = props.originalUrl;
    this.affiliateUrl = props.affiliateUrl;
    this.currentPrice = props.currentPrice;
    this.previousPrice = props.previousPrice;
    this.discountPercentage = props.discountPercentage;
    this.images = props.images;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updatePrice(newPrice: Price): void {
    if (!this.currentPrice.equals(newPrice)) {
      this.previousPrice = this.currentPrice;
      this.currentPrice = newPrice;
      this.discountPercentage = DiscountPercentage.calculate(this.currentPrice, this.previousPrice);
      this.updatedAt = new Date();
    }
  }

  public archive(): void {
    this.status = 'ARCHIVED';
    this.updatedAt = new Date();
  }
}
