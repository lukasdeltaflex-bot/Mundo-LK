import { AffiliateLink } from './affiliate-link.entity';

export type SourceStatus = 'CONFIRMED' | 'NOT_AVAILABLE' | 'EXPIRED';
export type MarketplaceSlug = 'shopee' | 'mercadolivre' | 'amazon' | 'tiktok' | 'magalu' | 'shein' | 'aliexpress' | 'casasbahia' | 'kabum' | 'outros' | (string & {});

export interface ProductImages {
  main: string;
  gallery: string[];
}

export interface OfferProductData {
  title: string;
  description?: string;
  brand?: string;
  images: ProductImages;
  category: string;
  seller: string;
  sku?: string | null;
}

export interface OfferPricing {
  currentPrice: number;
  originalPrice: number | null;
  discountPercentage: number | null;
  sourceStatus: SourceStatus;
}

export interface OfferCommission {
  value: number | null;
  percentage: number | null;
  sourceStatus: SourceStatus;
}

export interface OfferContent {
  whatsappCopy?: string | null;
  instagramCaption?: string | null;
  tiktokScript?: string | null;
  hashtags?: string[];
  generatedAt?: string | null;
}

export interface AffiliateOfferProps {
  id: string;
  userId: string;
  tenantId?: string;
  marketplace: MarketplaceSlug;
  marketplaceItemId: string;
  originalUrl: string;
  affiliateLink: AffiliateLink;
  productData: OfferProductData;
  pricing: OfferPricing;
  commission: OfferCommission;
  offerContent?: OfferContent;
  status: 'ACTIVE' | 'EXPIRED';
  importedAt?: string;
  updatedAt?: string;
}

/**
 * AffiliateOffer — Entidade Central de Oferta de Afiliado (Release 2.3.0)
 *
 * Separa estritamente os Dados Reais do Marketplace dos Dados Criativos da IA,
 * garantindo que atualizações de preço não apaguem conteúdos já gerados.
 */
export class AffiliateOffer {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly marketplace: MarketplaceSlug;
  public readonly marketplaceItemId: string;
  public readonly originalUrl: string;
  public readonly affiliateLink: AffiliateLink;
  public productData: OfferProductData;
  public pricing: OfferPricing;
  public commission: OfferCommission;
  public offerContent: OfferContent;
  public status: 'ACTIVE' | 'EXPIRED';
  public readonly importedAt: string;
  public updatedAt: string;

  constructor(props: AffiliateOfferProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.marketplace = props.marketplace;
    this.marketplaceItemId = props.marketplaceItemId;
    this.originalUrl = props.originalUrl;
    this.affiliateLink = props.affiliateLink;
    this.productData = props.productData;
    this.pricing = props.pricing;
    this.commission = props.commission;
    this.offerContent = props.offerContent || {};
    this.status = props.status;
    this.importedAt = props.importedAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }

  public updatePricing(newPricing: OfferPricing): void {
    this.pricing = newPricing;
    this.updatedAt = new Date().toISOString();
  }

  public setContent(content: OfferContent): void {
    this.offerContent = {
      ...this.offerContent,
      ...content,
      generatedAt: new Date().toISOString(),
    };
    this.updatedAt = new Date().toISOString();
  }
}
