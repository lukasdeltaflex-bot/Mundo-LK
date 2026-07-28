import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { FirestoreAuditLogRepository } from '@/infrastructure/firebase/repositories/firestore-audit-log.repository';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';

export interface ExportJobParams {
  userId: string;
  type: 'offers' | 'products' | 'logs';
  format: 'csv' | 'json';
}

export interface ExportResult {
  jobId: string;
  filename: string;
  content: string;
  mimeType: string;
}

export class BackupExportService {
  private productRepo = new FirestoreProductRepository();
  private offerRepo = new FirestoreOfferRepository();
  private auditRepo = new FirestoreAuditLogRepository();

  /**
   * Generates a tenant-isolated export file in CSV or JSON format.
   */
  public async exportData(params: ExportJobParams): Promise<ExportResult> {
    const jobId = `job_${Date.now()}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${params.type}_export_${timestamp}.${params.format}`;
    let content = '';
    let mimeType = 'text/plain';

    if (params.type === 'offers') {
      const offers = await this.offerRepo.findByUserId(params.userId);
      if (params.format === 'json') {
        content = JSON.stringify(offers, null, 2);
        mimeType = 'application/json';
      } else {
        mimeType = 'text/csv';
        const headers = ['ID', 'ProductId', 'AIProvider', 'Hashtags', 'CreatedAt'];
        const rows = offers.map((o) => [
          o.id,
          o.productId,
          o.aiProviderUsed,
          (o.hashtags || []).join(' '),
          o.createdAt ? new Date(o.createdAt).toISOString() : '',
        ]);
        content = [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');
      }
    } else if (params.type === 'products') {
      const products = await this.productRepo.findAll(params.userId);
      if (params.format === 'json') {
        content = JSON.stringify(products, null, 2);
        mimeType = 'application/json';
      } else {
        mimeType = 'text/csv';
        const headers = ['ID', 'Title', 'Marketplace', 'CurrentPrice', 'OriginalUrl'];
        const rows = products.map((p) => [
          p.id,
          p.title,
          p.marketplaceSlug,
          p.currentPrice ? p.currentPrice.amount : 0,
          p.originalUrl,
        ]);
        content = [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');
      }
    } else {
      const logs = await this.auditRepo.findByUserId(params.userId, 100);
      if (params.format === 'json') {
        content = JSON.stringify(logs, null, 2);
        mimeType = 'application/json';
      } else {
        mimeType = 'text/csv';
        const headers = ['ID', 'Action', 'Module', 'Entity', 'EntityId', 'Timestamp'];
        const rows = logs.map((l) => [l.id, l.action, l.module, l.entity, l.entityId, l.timestamp]);
        content = [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');
      }
    }

    // Grava o trabalho na coleção export_jobs
    try {
      const ref = doc(db, 'export_jobs', jobId);
      await setDoc(ref, {
        id: jobId,
        userId: params.userId,
        type: params.type,
        format: params.format,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[BackupExportService] Erro ao gravar export_job no Firestore:', err);
    }

    return {
      jobId,
      filename,
      content,
      mimeType,
    };
  }

  /**
   * Helper to trigger browser file download.
   */
  public downloadFile(filename: string, content: string, mimeType: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
