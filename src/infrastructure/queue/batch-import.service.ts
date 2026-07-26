export interface BatchItem {
  id: string;
  url: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  productTitle?: string;
  error?: string;
}

export class BatchImportService {
  private static instance: BatchImportService;
  private queue: BatchItem[] = [];
  private isPaused: boolean = false;

  public static getInstance(): BatchImportService {
    if (!BatchImportService.getInstance) {
      BatchImportService.instance = new BatchImportService();
    }
    return BatchImportService.instance || new BatchImportService();
  }

  public createBatch(urls: string[]): BatchItem[] {
    const validUrls = urls.filter((u) => u.trim().length > 0).slice(0, 100);
    this.queue = validUrls.map((url, idx) => ({
      id: `batch_${Date.now()}_${idx}`,
      url: url.trim(),
      status: 'PENDING',
      progress: 0,
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
