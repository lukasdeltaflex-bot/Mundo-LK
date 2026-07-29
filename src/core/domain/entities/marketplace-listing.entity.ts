import { MarketplaceConnectionSlug } from './marketplace-connection.entity';

export type ListingStatus =
  | 'DRAFT'
  | 'WAITING_APPROVAL'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'PAUSED'
  | 'ARCHIVED'
  | 'EXPIRED_TOKEN'
  | 'SYNC_ERROR';

export type SyncStatus = 'SYNCED' | 'PENDING' | 'ERROR';

export interface MarketplaceListingProps {
  id: string;
  userId: string;
  tenantId: string;
  productId: string;
  offerId: string;
  marketplaceSlug: MarketplaceConnectionSlug;
  externalId?: string | null;
  listingUrl?: string | null;
  status: ListingStatus;
  syncStatus: SyncStatus;
  price: number;
  stock: number;
  externalData?: Record<string, unknown>;
  errorMessage?: string | null;
  publishedAt?: string | null;
  lastSyncAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * MarketplaceListing — Entidade de Anúncios Publicados (Release 2.2.7)
 * Registra o vínculo entre a Oferta/Produto interna e o anúncio ativo no marketplace.
 * Imutável no Firestore (nunca deletado).
 */
export class MarketplaceListing {
  public readonly id: string;
  public readonly userId: string;
  public readonly tenantId: string;
  public readonly productId: string;
  public readonly offerId: string;
  public readonly marketplaceSlug: MarketplaceConnectionSlug;
  public externalId?: string | null;
  public listingUrl?: string | null;
  public status: ListingStatus;
  public syncStatus: SyncStatus;
  public price: number;
  public stock: number;
  public externalData: Record<string, unknown>;
  public errorMessage?: string | null;
  public publishedAt?: string | null;
  public lastSyncAt?: string;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: MarketplaceListingProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tenantId = props.tenantId || props.userId;
    this.productId = props.productId;
    this.offerId = props.offerId;
    this.marketplaceSlug = props.marketplaceSlug;
    this.externalId = props.externalId || null;
    this.listingUrl = props.listingUrl || null;
    this.status = props.status || 'DRAFT';
    this.syncStatus = props.syncStatus || 'PENDING';
    this.price = props.price || 0;
    this.stock = props.stock ?? 1;
    this.externalData = props.externalData || {};
    this.errorMessage = props.errorMessage || null;
    this.publishedAt = props.publishedAt || null;
    this.lastSyncAt = props.lastSyncAt;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.updatedAt = props.updatedAt || new Date().toISOString();
  }
}
