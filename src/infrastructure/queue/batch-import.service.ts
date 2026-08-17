import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';
import { OfferPreview } from '@/presentation/actions/analyze-url.action';
import { OfferStyle } from '@/infrastructure/ai/providers/gemini.adapter';

export type BatchItemStatus =
  | 'PENDING'
  | 'EXTRACTING'
  | 'EXTRACTED'
  | 'NEEDS_REVIEW'
  | 'READY_FOR_AI'
  | 'AI_GENERATING'
  | 'AI_READY'
  | 'ERROR'
  | 'SAVED';

export interface BatchItem {
  id: string;
  url: string;
  status: BatchItemStatus;
  progress: number;
  productTitle?: string;
  marketplaceSlug?: string;
  currentPrice?: number | null;
  imageUrl?: string;
  extractionResult?: ProductExtractionResult;
  userConfirmedData?: Partial<ProductExtractionResult>;
  offerPreview?: OfferPreview;
  selected?: boolean;
  style?: OfferStyle;
  error?: string;
  reviewReason?: string;
}

export class BatchImportService {
  private static instance: BatchImportService;
  private queue: BatchItem[] = [];
  private isPaused: boolean = false;

  public static getInstance(): BatchImportService {
    if (!BatchImportService.instance) {
      BatchImportService.instance = new BatchImportService();
    }
    return BatchImportService.instance;
  }

  public createBatch(urls: string[]): BatchItem[] {
    const rawUrls = urls.map((u) => u.trim()).filter((u) => u.length > 0);
    // Deduplicação de URLs
    const uniqueUrls = Array.from(new Set(rawUrls)).slice(0, 100);

    this.queue = uniqueUrls.map((url, idx) => ({
      id: `batch_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      url,
      status: 'PENDING',
      progress: 0,
      selected: true,
      style: 'padrao',
    }));
    return [...this.queue];
  }

  public getQueue(): BatchItem[] {
    return [...this.queue];
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public cancel(): void {
    this.queue = [];
    this.isPaused = false;
  }
}
