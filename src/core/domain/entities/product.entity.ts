import { Price, DiscountPercentage, AffiliateLink } from '../value-objects';

export type ProductStatus = 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK' | 'TRASHED';
export type CategorySource = 'AI' | 'MANUAL' | 'IMPORT' | 'SYSTEM' | 'LEARNED';

export interface DispatchRecord {
  id: string;
  dispatchedAt: string; // ISO date string
  channel: string; // e.g. "WhatsApp Promoções 01"
  targetGroup?: string; // e.g. "Grupo VIP"
  sentBy?: string; // e.g. "Admin"
  type: 'MANUAL' | 'AUTOMATIC';
  notes?: string;
}

export type DispatchStatus =
  | 'NUNCA_ENVIADA'       // 🟢 Total envios = 0 (Prioridade Alta)
  | 'ENVIADA_HOJE'        // 🔵 Enviada nas últimas 24h
  | 'ENVIADA_RECENTEMENTE' // 🔴 Enviada nos últimos 3 dias (Evitar novo envio!)
  | 'CANDIDATA_REENVIO'   // 🟡 Enviada há mais de 15 dias (ou 3-15 dias)
  | 'ARQUIVADA';          // ⚪ Status arquivado

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

  // Categorization Engine Fields
  subcategoryId?: string | null;
  categorySource?: CategorySource | null;
  categoryConfidence?: number | null;
  categoryLocked?: boolean;
  categoryUpdatedAt?: Date | null;
  categoryReasoning?: string | null;

  // Dispatch & Campaign Tracking Fields
  dispatchCount?: number;
  firstDispatchedAt?: Date | null;
  lastDispatchedAt?: Date | null;
  lastChannel?: string | null;
  dispatchHistory?: DispatchRecord[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pure Domain Entity representing an Affiliate Product with Campaign Dispatch Control & Hybrid Categorization Engine.
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

  // Categorization State
  public subcategoryId: string | null;
  public categorySource: CategorySource | null;
  public categoryConfidence: number | null;
  public categoryLocked: boolean;
  public categoryUpdatedAt: Date | null;
  public categoryReasoning: string | null;

  // Dispatch Tracking State
  public dispatchCount: number;
  public firstDispatchedAt?: Date | null;
  public lastDispatchedAt?: Date | null;
  public lastChannel?: string | null;
  public dispatchHistory: DispatchRecord[];

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

    this.subcategoryId = props.subcategoryId || null;
    this.categorySource = props.categorySource || null;
    this.categoryConfidence = props.categoryConfidence ?? null;
    this.categoryLocked = props.categoryLocked ?? false;
    this.categoryUpdatedAt = props.categoryUpdatedAt || null;
    this.categoryReasoning = props.categoryReasoning || null;

    this.dispatchCount = props.dispatchCount ?? 0;
    this.firstDispatchedAt = props.firstDispatchedAt ?? null;
    this.lastDispatchedAt = props.lastDispatchedAt ?? null;
    this.lastChannel = props.lastChannel ?? null;
    this.dispatchHistory = props.dispatchHistory ?? [];

    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateCategory(params: {
    categoryId: string | null;
    subcategoryId?: string | null;
    source: CategorySource;
    confidence?: number | null;
    locked?: boolean;
    reasoning?: string | null;
  }): boolean {
    // MANUAL LOCKED precedence safeguard
    if (this.categoryLocked && params.source !== 'MANUAL') {
      return false; // Ignored as locked by manual user assignment
    }

    this.categoryId = params.categoryId || '';
    this.subcategoryId = params.subcategoryId || null;
    this.categorySource = params.source;
    this.categoryConfidence = params.confidence ?? null;
    if (params.locked !== undefined) {
      this.categoryLocked = params.locked;
    }
    this.categoryUpdatedAt = new Date();
    if (params.reasoning !== undefined) {
      this.categoryReasoning = params.reasoning;
    }
    this.updatedAt = new Date();
    return true;
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

  /**
   * Registers a new campaign dispatch event and updates tracking counters.
   */
  public recordDispatch(record: Omit<DispatchRecord, 'id' | 'dispatchedAt'>): DispatchRecord {
    const newRecord: DispatchRecord = {
      id: `disp_${Date.now()}_${Math.floor(performance.now() * 1000)}`,
      dispatchedAt: new Date().toISOString(),
      channel: record.channel,
      targetGroup: record.targetGroup || 'Canal Geral',
      sentBy: record.sentBy || 'Admin',
      type: record.type || 'MANUAL',
      notes: record.notes || '',
    };

    if (!this.dispatchHistory) this.dispatchHistory = [];
    this.dispatchHistory.unshift(newRecord);
    this.dispatchCount = (this.dispatchCount || 0) + 1;
    if (!this.firstDispatchedAt) this.firstDispatchedAt = new Date();
    this.lastDispatchedAt = new Date();
    this.lastChannel = record.channel;
    this.updatedAt = new Date();

    return newRecord;
  }

  /**
   * Calculates the automatic traffic light dispatch status.
   */
  public getDispatchStatus(): DispatchStatus {
    if (this.status === 'ARCHIVED' || this.status === 'TRASHED') return 'ARQUIVADA';
    if (!this.dispatchCount || this.dispatchCount === 0 || !this.lastDispatchedAt) {
      return 'NUNCA_ENVIADA';
    }

    const lastDate = new Date(this.lastDispatchedAt);
    const now = new Date();
    const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours <= 24) return 'ENVIADA_HOJE';
    if (diffDays <= 3) return 'ENVIADA_RECENTEMENTE';
    if (diffDays >= 15) return 'CANDIDATA_REENVIO';

    return 'ENVIADA_RECENTEMENTE';
  }
}
