import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';
import { ProductIdentityResolver } from '@/core/domain/services/ProductIdentityResolver';
import { ProviderManager } from '@/infrastructure/marketplaces/providers/ProviderManager';
import { FirestoreExtractionCacheRepository } from '@/infrastructure/firebase/repositories/firestore-extraction-cache.repository';
import { ExtractionCacheDoc } from '@/core/domain/ports/repositories/IExtractionCacheRepository';
import { getShopeeApiConfig } from '@/infrastructure/marketplaces/config/shopee-api.config';

export interface ResolutionStepLog {
  stepNumber: number;
  stepName: string;
  providerName: string;
  status: 'SUCCESS' | 'SKIPPED' | 'FAILED' | 'PENDING';
  message: string;
  durationMs: number;
}

export interface ImportEngineResult {
  data: ProductExtractionResult;
  marketplaceSlug: string;
  canonicalKey: string;
  sourceProvider: string;
  logs: ResolutionStepLog[];
  requiresManualReview: boolean;
  reviewReason?: string;
}

export class ImportEngine {
  private cacheRepo = new FirestoreExtractionCacheRepository();
  private providerManager = new ProviderManager();
  private identityResolver = new ProductIdentityResolver();

  /**
   * Executes the 6-Level Smart Resolution Pipeline without inventing fake data.
   */
  public async resolveProduct(input: string, mode: 'url' | 'sku' | 'ean' | 'name' | 'batch' = 'url'): Promise<ImportEngineResult> {
    const logs: ResolutionStepLog[] = [];
    const trimmedInput = input.trim();

    // ── NÍVEL 1: Identificação do Marketplace & Chave Canônica ─────────────
    const step1Start = Date.now();
    let marketplaceSlug = 'desconhecido';
    let canonicalKey = trimmedInput;
    let normalizedUrl = trimmedInput;

    if (mode === 'url' || trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
      const resolved = this.identityResolver.resolveCanonicalKey(trimmedInput);
      marketplaceSlug = resolved.marketplaceSlug;
      canonicalKey = resolved.canonicalKey;
      normalizedUrl = trimmedInput;

      logs.push({
        stepNumber: 1,
        stepName: 'Identificação de Marketplace & Chave Canônica',
        providerName: 'ProductIdentityResolver',
        status: 'SUCCESS',
        message: `Marketplace identificado: ${marketplaceSlug.toUpperCase()} | Key: ${canonicalKey}`,
        durationMs: Date.now() - step1Start,
      });
    } else {
      if (mode === 'sku') canonicalKey = `sku:${trimmedInput}`;
      else if (mode === 'ean') canonicalKey = `ean:${trimmedInput}`;
      else canonicalKey = `search:${trimmedInput}`;

      logs.push({
        stepNumber: 1,
        stepName: `Identificação por ${mode.toUpperCase()}`,
        providerName: 'InputResolver',
        status: 'SUCCESS',
        message: `Modo ${mode.toUpperCase()} recebido: ${trimmedInput}`,
        durationMs: Date.now() - step1Start,
      });
    }

    // ── NÍVEL 2: Consulta à API Oficial do Marketplace ────────────────────────
    const step2Start = Date.now();
    let apiConfigured = false;

    if (marketplaceSlug === 'shopee') {
      const cfg = getShopeeApiConfig();
      apiConfigured = cfg.isEnabled;
    } else if (marketplaceSlug === 'mercadolivre') {
      apiConfigured = Boolean(process.env.MERCADOLIVRE_CLIENT_ID);
    } else if (marketplaceSlug === 'amazon') {
      apiConfigured = Boolean(process.env.AMAZON_CLIENT_ID);
    }

    if (!apiConfigured) {
      logs.push({
        stepNumber: 2,
        stepName: 'Consulta API Oficial',
        providerName: `${marketplaceSlug.toUpperCase()} API`,
        status: 'SKIPPED',
        message: `❌ Credencial oficial do marketplace ${marketplaceSlug.toUpperCase()} não configurada no servidor (process.env).`,
        durationMs: Date.now() - step2Start,
      });
    } else {
      try {
        const apiResult = await this.providerManager.extract(normalizedUrl, marketplaceSlug);
        if (apiResult.success && apiResult.data && apiResult.data.title && apiResult.data.currentPrice) {
          logs.push({
            stepNumber: 2,
            stepName: 'Consulta API Oficial',
            providerName: apiResult.providerName,
            status: 'SUCCESS',
            message: `🟢 Dados completos obtidos via API Oficial!`,
            durationMs: apiResult.durationMs,
          });

          return this.buildResult(apiResult.data, marketplaceSlug, canonicalKey, apiResult.providerName, logs, false);
        }
      } catch (err) {
        logs.push({
          stepNumber: 2,
          stepName: 'Consulta API Oficial',
          providerName: `${marketplaceSlug.toUpperCase()} API`,
          status: 'FAILED',
          message: `Falha na requisição da API: ${err instanceof Error ? err.message : String(err)}`,
          durationMs: Date.now() - step2Start,
        });
      }
    }

    // ── NÍVEL 3: Cache Interno Firestore ─────────────────────────────────────
    const step3Start = Date.now();
    try {
      const cachedDoc = await this.cacheRepo.findByUrl(normalizedUrl);
      if (cachedDoc) {
        const cachedData: ProductExtractionResult = {
          title: cachedDoc.title,
          description: cachedDoc.description,
          currentPrice: cachedDoc.price,
          originalPrice: cachedDoc.oldPrice,
          discountPercentage: cachedDoc.discount,
          currency: cachedDoc.currency,
          brand: cachedDoc.brand,
          category: cachedDoc.category,
          subcategory: 'Geral',
          marketplace: cachedDoc.marketplace,
          sellerName: cachedDoc.seller,
          sellerRating: cachedDoc.rating,
          shippingType: cachedDoc.shipping,
          shippingPrice: null,
          freeShipping: false,
          prime: false,
          full: false,
          mall: false,
          coupon: cachedDoc.coupon,
          cashback: '',
          installments: '',
          image: cachedDoc.image,
          gallery: cachedDoc.images,
          rating: cachedDoc.rating,
          reviewCount: cachedDoc.reviews,
          soldQuantity: cachedDoc.sales,
          productId: cachedDoc.productId,
          canonicalUrl: cachedDoc.normalizedUrl,
          originalUrl: cachedDoc.url,
        };

        logs.push({
          stepNumber: 3,
          stepName: 'Cache Interno Firestore',
          providerName: 'FirestoreExtractionCacheRepository',
          status: 'SUCCESS',
          message: `⚡ Hit de cache em ${Date.now() - step3Start}ms para a chave ${canonicalKey}`,
          durationMs: Date.now() - step3Start,
        });

        return this.buildResult(cachedData, marketplaceSlug, canonicalKey, 'FirestoreCache', logs, false);
      } else {
        logs.push({
          stepNumber: 3,
          stepName: 'Cache Interno Firestore',
          providerName: 'FirestoreCacheRepository',
          status: 'FAILED',
          message: `Miss de cache (nenhum registro mantido nos últimos 7 dias)`,
          durationMs: Date.now() - step3Start,
        });
      }
    } catch {
      logs.push({
        stepNumber: 3,
        stepName: 'Cache Interno Firestore',
        providerName: 'FirestoreCacheRepository',
        status: 'FAILED',
        message: `Falha na consulta ao Firestore Cache`,
        durationMs: Date.now() - step3Start,
      });
    }

    // ── NÍVEL 4: ZenRows Scraper API (Bypass Cloudflare / Anti-bot Shopee) ────
    const step4Start = Date.now();
    const hasZenRows = Boolean(process.env.ZENROWS_API_KEY);

    if (!hasZenRows) {
      logs.push({
        stepNumber: 4,
        stepName: 'ZenRows Anti-bot Bypass',
        providerName: 'ZenRows API',
        status: 'SKIPPED',
        message: `❌ ZENROWS_API_KEY não configurada no servidor. Avançando no pipeline...`,
        durationMs: Date.now() - step4Start,
      });
    } else {
      try {
        const zenResult = await this.providerManager.extract(normalizedUrl, marketplaceSlug);
        if (zenResult.success && zenResult.data && (zenResult.data.title || zenResult.data.currentPrice)) {
          logs.push({
            stepNumber: 4,
            stepName: 'ZenRows Anti-bot Bypass',
            providerName: 'ZenRows',
            status: 'SUCCESS',
            message: `🟢 Extração concluída via ZenRows em ${zenResult.durationMs}ms`,
            durationMs: zenResult.durationMs,
          });

          await this.saveCache(normalizedUrl, marketplaceSlug, canonicalKey, zenResult.data, 'ZenRows');

          return this.buildResult(zenResult.data, marketplaceSlug, canonicalKey, 'ZenRows', logs, false);
        }
      } catch (err) {
        logs.push({
          stepNumber: 4,
          stepName: 'ZenRows Anti-bot Bypass',
          providerName: 'ZenRows',
          status: 'FAILED',
          message: `Falha no bypass ZenRows: ${err instanceof Error ? err.message : String(err)}`,
          durationMs: Date.now() - step4Start,
        });
      }
    }

    // ── NÍVEL 5: Apify Cloud Actors ──────────────────────────────────────────
    const step5Start = Date.now();
    const hasApify = Boolean(process.env.APIFY_API_TOKEN);

    if (!hasApify) {
      logs.push({
        stepNumber: 5,
        stepName: 'Apify Cloud Actors',
        providerName: 'Apify',
        status: 'SKIPPED',
        message: `❌ APIFY_API_TOKEN não configurado no servidor. Avançando...`,
        durationMs: Date.now() - step5Start,
      });
    } else {
      try {
        const apifyResult = await this.providerManager.extract(normalizedUrl, marketplaceSlug);
        if (apifyResult.success && apifyResult.data && apifyResult.data.title) {
          logs.push({
            stepNumber: 5,
            stepName: 'Apify Cloud Actors',
            providerName: 'Apify',
            status: 'SUCCESS',
            message: `🟢 Extração via Apify Actor executada com sucesso!`,
            durationMs: apifyResult.durationMs,
          });

          await this.saveCache(normalizedUrl, marketplaceSlug, canonicalKey, apifyResult.data, 'Apify');

          return this.buildResult(apifyResult.data, marketplaceSlug, canonicalKey, 'Apify', logs, false);
        }
      } catch {
        logs.push({
          stepNumber: 5,
          stepName: 'Apify Cloud Actors',
          providerName: 'Apify',
          status: 'FAILED',
          message: `Falha na execução do Actor Apify`,
          durationMs: Date.now() - step5Start,
        });
      }
    }

    // ── NÍVEL 6: Parser HTML Universal / Local Fallback ───────────────────────
    const step6Start = Date.now();
    try {
      const waterfallResult = await this.providerManager.extract(normalizedUrl, marketplaceSlug);
      if (waterfallResult.success && waterfallResult.data && (waterfallResult.data.title || waterfallResult.data.currentPrice)) {
        logs.push({
          stepNumber: 6,
          stepName: 'Parser HTML Universal',
          providerName: waterfallResult.providerName,
          status: 'SUCCESS',
          message: `🟢 HTML extraído com sucesso pelo Parser Universal`,
          durationMs: waterfallResult.durationMs,
        });

        await this.saveCache(normalizedUrl, marketplaceSlug, canonicalKey, waterfallResult.data, waterfallResult.providerName);

        return this.buildResult(waterfallResult.data, marketplaceSlug, canonicalKey, waterfallResult.providerName, logs, false);
      }
    } catch {
      // Ignora erro para acionar conferência manual
    }

    logs.push({
      stepNumber: 6,
      stepName: 'Parser HTML Universal',
      providerName: 'LocalParser',
      status: 'FAILED',
      message: `Nenhum provedor obteve dados suficientes. Acionando conferência manual...`,
      durationMs: Date.now() - step6Start,
    });

    // ── FALLBACK OBRIGATÓRIO: Conferência Manual (SEM DADOS INVENTADOS!) ───────
    const fallbackData: ProductExtractionResult = {
      title: mode === 'name' ? trimmedInput : '',
      description: '',
      currentPrice: null, // Regra anti-dados-falsos: preço NULO para preenchimento manual pelo usuário
      originalPrice: null,
      discountPercentage: 0,
      currency: 'BRL',
      brand: '',
      category: 'Geral',
      subcategory: 'Geral',
      marketplace: marketplaceSlug.toUpperCase(),
      sellerName: '',
      sellerRating: 0,
      shippingType: '',
      shippingPrice: null,
      freeShipping: false,
      prime: false,
      full: false,
      mall: false,
      coupon: '',
      cashback: '',
      installments: '',
      image: '', // Regra anti-dados-falsos: imagem NULA
      gallery: [],
      rating: 0,
      reviewCount: 0,
      soldQuantity: '',
      productId: canonicalKey,
      canonicalUrl: normalizedUrl,
      originalUrl: trimmedInput,
    };

    return {
      data: fallbackData,
      marketplaceSlug,
      canonicalKey,
      sourceProvider: 'Conferência Manual (Fallback)',
      logs,
      requiresManualReview: true,
      reviewReason: 'Dados incompletos no pipeline. É necessária a conferência e preenchimento manual dos campos de título e preço.',
    };
  }

  private async saveCache(
    url: string,
    marketplace: string,
    productId: string,
    data: Partial<ProductExtractionResult>,
    provider: string
  ): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const docData: ExtractionCacheDoc = {
        id: `cache_${Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-24)}`,
        url,
        normalizedUrl: url,
        marketplace,
        productId,
        title: data.title || '',
        description: data.description || '',
        price: data.currentPrice ?? null,
        oldPrice: data.originalPrice ?? null,
        currency: data.currency || 'BRL',
        discount: data.discountPercentage || 0,
        image: data.image || '',
        images: data.gallery || [],
        brand: data.brand || '',
        category: data.category || 'Geral',
        seller: data.sellerName || '',
        rating: data.rating || 0,
        reviews: data.reviewCount || 0,
        sales: data.soldQuantity || '',
        shipping: data.shippingType || '',
        coupon: data.coupon || '',
        confidence: 0.9,
        source: provider,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt,
      };

      await this.cacheRepo.save(docData);
    } catch {
      // Ignora erro de salvamento de cache silenciosamente
    }
  }

  private buildResult(
    partial: Partial<ProductExtractionResult>,
    marketplaceSlug: string,
    canonicalKey: string,
    sourceProvider: string,
    logs: ResolutionStepLog[],
    requiresReview: boolean
  ): ImportEngineResult {
    const fullData: ProductExtractionResult = {
      title: partial.title || '',
      description: partial.description || '',
      currentPrice: partial.currentPrice ?? null,
      originalPrice: partial.originalPrice ?? null,
      discountPercentage: partial.discountPercentage || 0,
      currency: partial.currency || 'BRL',
      brand: partial.brand || '',
      category: partial.category || 'Geral',
      subcategory: partial.subcategory || 'Geral',
      marketplace: partial.marketplace || marketplaceSlug.toUpperCase(),
      sellerName: partial.sellerName || '',
      sellerRating: partial.sellerRating || 0,
      shippingType: partial.shippingType || '',
      shippingPrice: partial.shippingPrice ?? null,
      freeShipping: partial.freeShipping || false,
      prime: partial.prime || false,
      full: partial.full || false,
      mall: partial.mall || false,
      coupon: partial.coupon || '',
      cashback: partial.cashback || '',
      installments: partial.installments || '',
      image: partial.image || '',
      gallery: partial.gallery || [],
      rating: partial.rating || 0,
      reviewCount: partial.reviewCount || 0,
      soldQuantity: partial.soldQuantity || '',
      productId: partial.productId || canonicalKey,
      canonicalUrl: partial.canonicalUrl || '',
      originalUrl: partial.originalUrl || '',
    };

    const isMissingEssential = !fullData.title || fullData.currentPrice === null;

    return {
      data: fullData,
      marketplaceSlug,
      canonicalKey,
      sourceProvider,
      logs,
      requiresManualReview: requiresReview || isMissingEssential,
      reviewReason: isMissingEssential
        ? 'Dados incompletos no pipeline. É necessária a conferência manual de título e preço.'
        : undefined,
    };
  }
}
