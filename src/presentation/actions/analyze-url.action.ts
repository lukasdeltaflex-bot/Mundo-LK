'use server';

import { MarketplaceRegistry } from '@/infrastructure/marketplaces/registry/MarketplaceRegistry';
import { ProviderManager } from '@/infrastructure/marketplaces/providers/ProviderManager';
import { CacheService } from '@/infrastructure/cache/CacheService';
import { ConfidenceService } from '@/infrastructure/marketplaces/services/ConfidenceService';
import { expandShortenedUrl } from '@/infrastructure/marketplaces/scraper/product-page-scraper';
import { GeminiAIAdapter, type OfferStyle } from '@/infrastructure/ai/providers/gemini.adapter';
import { AIContextBuilder } from '@/infrastructure/ai/services/AIContextBuilder';
import { OfferBuilder } from '@/infrastructure/ai/services/OfferBuilder';
import { AnalyticsLogger } from '@/infrastructure/analytics/AnalyticsLogger';
import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';
import { Product } from '@/core/domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '@/core/domain/value-objects';

export interface OfferPreview {
  product: {
    id:              string;
    title:           string;
    description:     string;
    brand:           string;
    price:           string;
    priceAmount:     number;
    previousPrice?:  string;
    discountPercent: string;
    imageUrl:        string;
    originalUrl:     string;
    affiliateUrl:    string;
    marketplaceSlug: string;
    categoryId:      string;
  };
  analysis: {
    publicoAlvo:        string;
    dorQueResolve:      string;
    beneficioPrincipal: string;
    argumentoComercial: string;
    anguloDeVenda:      string;
    emocaoDeCompra:     string;
  };
  offer: {
    score:         number;
    scoreLabel:    string;
    justification: string;
    cta:           string;
    hashtags:      string[];
    emojis:        string[];
    whatsAppText:  string;
    telegramText:  string;
    instagramText: string;
    facebookText:  string;
    channelText:   string;
    storyText:     string;
    style:         OfferStyle;
  };
}

function sanitizeUrl(rawUrl: string): string {
  let trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

const registry = new MarketplaceRegistry();
const providerManager = new ProviderManager();
const cacheService = new CacheService();
const confidenceService = new ConfidenceService();
const aiContextBuilder = new AIContextBuilder();
const offerBuilder = new OfferBuilder();
const analyticsLogger = AnalyticsLogger.getInstance();

// ─── Action 1: Extract Real Product Metadata & Confidence (Pre-AI) ───────────

export async function extractProductDetailsAction(input: {
  url: string;
  affiliateTag?: string;
}): Promise<{
  success: true;
  data: ProductExtractionResult;
  confidenceScore: number;
  requiresConfirmation: boolean;
  affiliateUrl: string;
  marketplaceSlug: string;
} | {
  success: false;
  error: string;
}> {
  const startTime = Date.now();
  const rawUrl = sanitizeUrl(input.url);

  if (!rawUrl || rawUrl.length < 10) {
    return {
      success: false,
      error: 'Por favor, insira uma URL válida de produto (ex: https://mercadolivre.com.br/... ou https://shopee.com.br/...)'
    };
  }

  console.log(`[Router] 📥 URL recebida: ${rawUrl}`);

  try {
    // 1. Expand Short Link
    const expandedUrl = await expandShortenedUrl(rawUrl);
    console.log(`[Router] 🔗 URL expandida: ${expandedUrl}`);

    // 2. Identify Marketplace Plugin
    const plugin = registry.getPluginForUrl(expandedUrl);
    console.log(`[Router] 🏪 Marketplace identificado: ${plugin.name} (${plugin.slug})`);

    // 3. Resolve Canonical Product ID
    const productIdKey = plugin.extractProductId(expandedUrl) || `${plugin.slug}_${Buffer.from(expandedUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(-16)}`;
    console.log(`[Router] 🔑 Key de Produto Canônica: ${productIdKey}`);

    // 4. Consult 2-Tier Cache (L1 Memory ➔ L2 Firestore)
    const cached = await cacheService.getCachedProduct(productIdKey);
    if (cached && !cached.isPriceStale) {
      console.log(`[Cache] ⚡ Hit de Cache ${cached.tier} (<50ms) para ${productIdKey}`);

      const affiliateUrl = `${expandedUrl}${expandedUrl.includes('?') ? '&' : '?'}tag=${input.affiliateTag || 'mundolk'}`;

      await analyticsLogger.logMetric({
        sessionId: `sess_${Date.now()}`,
        requestId: `req_${Date.now()}`,
        url: rawUrl,
        expandedUrl,
        marketplace: plugin.slug,
        providerUsed: `Cache_${cached.tier}`,
        confidenceScore: cached.confidence,
        productFound: true,
        cacheHit: true,
        cacheTier: cached.tier,
        scrapingDurationMs: Date.now() - startTime,
        totalDurationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        data: cached.product,
        confidenceScore: cached.confidence,
        requiresConfirmation: cached.confidence < 80,
        affiliateUrl,
        marketplaceSlug: plugin.slug,
      };
    }

    // 5. ProviderManager Waterfall Extraction
    const extractionResult = await providerManager.extract(expandedUrl, plugin.slug);
    const rawData = extractionResult.data || {};

    // 6. Normalize Product Data
    const normalizedProduct = plugin.normalize(rawData, rawUrl, expandedUrl);

    // 7. Calculate Confidence Score
    const confidenceReport = confidenceService.calculateConfidence(normalizedProduct);
    console.log(`[Confidence] 🎯 Score calculado: ${confidenceReport.score}% (Requer confirmação? ${confidenceReport.requiresConfirmation})`);

    // 8. Save to Cache if score >= 40
    if (confidenceReport.score >= 40) {
      await cacheService.saveProductCache(productIdKey, normalizedProduct, confidenceReport.score);
    }

    const affiliateUrl = `${expandedUrl}${expandedUrl.includes('?') ? '&' : '?'}tag=${input.affiliateTag || 'mundolk'}`;

    await analyticsLogger.logMetric({
      sessionId: `sess_${Date.now()}`,
      requestId: `req_${Date.now()}`,
      url: rawUrl,
      expandedUrl,
      marketplace: plugin.slug,
      providerUsed: extractionResult.providerName,
      confidenceScore: confidenceReport.score,
      productFound: !!normalizedProduct.title,
      cacheHit: false,
      scrapingDurationMs: Date.now() - startTime,
      totalDurationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      data: normalizedProduct,
      confidenceScore: confidenceReport.score,
      requiresConfirmation: confidenceReport.requiresConfirmation,
      affiliateUrl,
      marketplaceSlug: plugin.slug,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[Error] Stack completa na extração:`, error);
    return {
      success: false,
      error: `Não foi possível acessar a página do produto: ${error.message}`
    };
  }
}

// ─── Action 2: Generate AI Offer Content from Confirmed Data ──────────────────

export async function analyzeProductUrlAction(input: {
  url: string;
  affiliateTag?: string;
  userId?: string;
  style?: OfferStyle;
  confirmedData?: ProductExtractionResult;
}): Promise<{ success: true; data: OfferPreview } | { success: false; error: string }> {
  const startTime = Date.now();
  try {
    const rawUrl = sanitizeUrl(input.url);
    if (!rawUrl || rawUrl.length < 10) {
      return { success: false, error: 'URL do produto inválida.' };
    }

    let productData: ProductExtractionResult;

    if (input.confirmedData && input.confirmedData.title) {
      productData = input.confirmedData;
      console.log(`[Action] 👤 Usando dados confirmados pelo usuário para ${productData.title}`);
    } else {
      const details = await extractProductDetailsAction({ url: rawUrl, affiliateTag: input.affiliateTag });
      if (!details.success) {
        return { success: false, error: details.error };
      }

      if (details.requiresConfirmation) {
        return {
          success: false,
          error: `A extração do produto retornou confiança de ${details.confidenceScore}%. Por favor, confirme os dados na tela de conferência antes de gerar com IA.`
        };
      }
      productData = details.data;
    }

    // Prepare domain Product entity for legacy adapter compat
    const currentPrice = Price.create(productData.currentPrice || 0);
    const previousPrice = productData.originalPrice ? Price.create(productData.originalPrice) : null;
    const discountPct = DiscountPercentage.calculate(currentPrice, previousPrice);

    const tempProduct = new Product({
      id: `preview_${Date.now()}`,
      userId: input.userId || 'guest',
      title: productData.title,
      description: productData.description || `Produto oficial ${productData.brand}`,
      brand: productData.brand || 'Desconhecida',
      categoryId: productData.category || 'Geral',
      marketplaceSlug: productData.marketplace,
      originalUrl: productData.originalUrl || rawUrl,
      affiliateUrl: AffiliateLink.create(productData.canonicalUrl || rawUrl),
      currentPrice,
      previousPrice,
      discountPercentage: discountPct,
      images: [productData.image, ...productData.gallery].filter(Boolean),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const style = input.style ?? 'padrao';
    console.log(`[Gemini] 🤖 Invocando IA Gemini para: ${tempProduct.title} (Estilo: ${style})`);

    const geminiAdapter = new GeminiAIAdapter();
    const aiResult = await geminiAdapter.generateOfferContent(tempProduct, style);

    // Calculate Commercial Quality Score
    const qualityScore = offerBuilder.calculateQualityScore(productData);

    const copiesData = aiResult.copies?.copies ?? {};
    const whatsAppText  = String(copiesData.whatsAppText || '');
    const telegramText  = String(copiesData.telegramText || '');
    const instagramText = String(copiesData.instagramText || '');
    const facebookText  = String(copiesData.facebookText || '');
    const channelText   = String(copiesData.channelText || '');
    const storyText     = String(copiesData.storyText || '');

    const scoreVal = qualityScore.overallScore;
    const scoreLabelStr = scoreVal >= 80 ? 'EXCELLENT' : scoreVal >= 50 ? 'GOOD' : 'REGULAR';

    const rawAnalysis = (aiResult as any).analysis || {};
    const publicoAlvo        = String(rawAnalysis.publicoAlvo || 'Consumidores em geral');
    const dorQueResolve      = String(rawAnalysis.dorQueResolve || 'Necessidade de compra inteligente');
    const beneficioPrincipal = String(rawAnalysis.beneficioPrincipal || 'Qualidade e economia');
    const argumentoComercial = String(rawAnalysis.argumentoComercial || `${productData.title} com ótimo preço`);
    const anguloDeVenda      = String(rawAnalysis.anguloDeVenda || 'Custo-Benefício');
    const emocaoDeCompra     = String(rawAnalysis.emocaoDeCompra || 'Satisfação');
    const categoria          = String(productData.category || 'Geral');

    console.log(`[Gemini] ✅ Oferta gerada em ${Date.now() - startTime}ms. Quality Score: ${scoreVal}%`);

    return {
      success: true,
      data: {
        product: {
          id: tempProduct.id,
          title: productData.title,
          description: productData.description,
          brand: productData.brand,
          price: currentPrice.formatBRL(),
          priceAmount: currentPrice.amount,
          previousPrice: previousPrice?.formatBRL(),
          discountPercent: discountPct.formatString(),
          imageUrl: productData.image,
          originalUrl: productData.originalUrl || rawUrl,
          affiliateUrl: productData.canonicalUrl || rawUrl,
          marketplaceSlug: productData.marketplace,
          categoryId: categoria,
        },
        analysis: {
          publicoAlvo,
          dorQueResolve,
          beneficioPrincipal,
          argumentoComercial,
          anguloDeVenda,
          emocaoDeCompra,
        },
        offer: {
          score: scoreVal,
          scoreLabel: scoreLabelStr,
          justification: qualityScore.justification,
          cta: String(aiResult.cta || 'Aproveite a oferta!'),
          hashtags: Array.isArray(aiResult.hashtags) ? aiResult.hashtags.map(String) : ['#oferta'],
          emojis: Array.isArray(aiResult.emojis) ? aiResult.emojis.map(String) : ['🔥'],
          whatsAppText,
          telegramText,
          instagramText,
          facebookText,
          channelText,
          storyText,
          style,
        },
      },
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[Error] Stack completa na geração de IA:`, error);
    return {
      success: false,
      error: `[ERRO NA IA]: ${error.message}`
    };
  }
}
