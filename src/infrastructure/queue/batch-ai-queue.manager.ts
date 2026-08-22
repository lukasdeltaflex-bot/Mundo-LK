import { BatchItem } from './batch-import.service';
import { analyzeProductUrlAction } from '@/presentation/actions/analyze-url.action';
import { OfferStyle } from '@/infrastructure/ai/providers/gemini.adapter';
import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';

export interface AIQueueItemResult {
  itemId: string;
  success: boolean;
  offerPreview?: any;
  error?: string;
  isQuotaExhausted?: boolean;
}

export class BatchAIQueueManager {
  private maxConcurrency: number;

  constructor(maxConcurrency: number = 2) {
    this.maxConcurrency = maxConcurrency;
  }

  /**
   * Processes selected batch items through the AI pipeline on-demand with concurrency limits and anti-429 handling.
   * Eligible statuses: EXTRACTED, NEEDS_REVIEW, AI_READY, ERROR
   */
  public async processQueue(
    items: BatchItem[],
    selectedStyle: OfferStyle,
    userId?: string,
    onItemUpdate?: (item: BatchItem) => void,
    onQuotaExhausted?: (reason: string) => void
  ): Promise<AIQueueItemResult[]> {
    const results: AIQueueItemResult[] = [];
    const pending = [...items];
    let quotaExhaustedShorthand = false;

    console.log(`[BATCH] BatchAIQueueManager starting | itemCount: ${items.length} | statuses: ${items.map(i => i.status).join(', ')}`);

    const worker = async () => {
      while (pending.length > 0) {
        if (quotaExhaustedShorthand) break;

        const currentItem = pending.shift();
        if (!currentItem) break;

        // Update item state to AI_GENERATING
        currentItem.status = 'AI_GENERATING';
        currentItem.progress = 50;
        if (onItemUpdate) onItemUpdate({ ...currentItem });

        let retries = 0;
        let success = false;
        let offerPreview: any = null;
        let itemError = '';
        let isQuota = false;

        while (retries < 3 && !success && !quotaExhaustedShorthand) {
          try {
            const confirmedData: ProductExtractionResult = {
              title: currentItem.productTitle || currentItem.extractionResult?.title || '',
              description: currentItem.userConfirmedData?.description || currentItem.extractionResult?.description || '',
              currentPrice: currentItem.currentPrice ?? currentItem.extractionResult?.currentPrice ?? 0,
              originalPrice: currentItem.userConfirmedData?.originalPrice ?? currentItem.extractionResult?.originalPrice ?? null,
              discountPercentage: currentItem.extractionResult?.discountPercentage || 0,
              currency: 'BRL',
              brand: currentItem.userConfirmedData?.brand || currentItem.extractionResult?.brand || '',
              category: currentItem.userConfirmedData?.category || currentItem.extractionResult?.category || 'Geral',
              subcategory: 'Geral',
              marketplace: (currentItem.marketplaceSlug || currentItem.extractionResult?.marketplace || 'GERAL').toUpperCase(),
              sellerName: currentItem.extractionResult?.sellerName || '',
              sellerRating: currentItem.extractionResult?.sellerRating || 0,
              shippingType: currentItem.extractionResult?.shippingType || '',
              shippingPrice: null,
              freeShipping: false,
              prime: false,
              full: false,
              mall: false,
              coupon: '',
              cashback: '',
              installments: '',
              image: currentItem.imageUrl || currentItem.extractionResult?.image || '',
              gallery: currentItem.extractionResult?.gallery || [],
              rating: 0,
              reviewCount: 0,
              soldQuantity: '',
              productId: currentItem.extractionResult?.productId || currentItem.id,
              canonicalUrl: currentItem.extractionResult?.canonicalUrl || currentItem.url,
              originalUrl: currentItem.url,
            };

            const actionRes = await analyzeProductUrlAction({
              url: currentItem.url,
              affiliateTag: 'mundolk',
              userId,
              style: currentItem.style || selectedStyle,
              confirmedData,
            });

            if (actionRes.success && actionRes.data) {
              success = true;
              offerPreview = actionRes.data;
              currentItem.offerPreview = offerPreview;
              currentItem.status = 'AI_READY';
              currentItem.progress = 100;
              if (onItemUpdate) onItemUpdate({ ...currentItem });
            } else {
              const errStr = (actionRes as any).error || 'Falha ao gerar Copy via IA';

              // Classificação estrita de HTTP 429 / Cota Esgotada
              if (
                errStr.includes('prepayment credits') ||
                errStr.includes('quota exceeded') ||
                errStr.includes('RESOURCE_EXHAUSTED') ||
                errStr.includes('Limite de cota ou créditos esgotados')
              ) {
                isQuota = true;
                quotaExhaustedShorthand = true;
                itemError = errStr;
                currentItem.status = 'ERROR';
                currentItem.error = '⚠️ Limite/Cota da IA atingido';
                if (onItemUpdate) onItemUpdate({ ...currentItem });
                if (onQuotaExhausted) onQuotaExhausted(errStr);
                break;
              }

              // Rate Limit temporário: Backoff exponencial
              if (errStr.includes('429') || errStr.includes('Rate Limit')) {
                retries++;
                const delayMs = Math.pow(2, retries) * 1000;
                console.warn(`[BatchAIQueueManager] ⏳ Rate Limit em ${currentItem.id}. Tentativa ${retries}/3 em ${delayMs}ms...`);
                await new Promise((r) => setTimeout(r, delayMs));
              } else {
                itemError = errStr;
                break;
              }
            }
          } catch (err) {
            itemError = err instanceof Error ? err.message : String(err);
            if (
              itemError.includes('prepayment credits') ||
              itemError.includes('quota exceeded') ||
              itemError.includes('RESOURCE_EXHAUSTED')
            ) {
              isQuota = true;
              quotaExhaustedShorthand = true;
              if (onQuotaExhausted) onQuotaExhausted(itemError);
              break;
            }
            retries++;
            await new Promise((r) => setTimeout(r, 1000));
          }
        }

        if (!success && !isQuota) {
          currentItem.status = 'ERROR';
          currentItem.error = itemError || 'Erro na geração da IA';
          if (onItemUpdate) onItemUpdate({ ...currentItem });
        }

        results.push({
          itemId: currentItem.id,
          success,
          offerPreview,
          error: itemError,
          isQuotaExhausted: isQuota,
        });

        // Pequeno intervalo sanitário entre chamadas
        await new Promise((r) => setTimeout(r, 800));
      }
    };

    // Executa os workers de acordo com maxConcurrency
    const workers = Array.from({ length: Math.min(this.maxConcurrency, items.length) }, () => worker());
    await Promise.all(workers);

    return results;
  }
}
