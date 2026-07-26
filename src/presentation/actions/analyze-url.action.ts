'use server';

import { initializeMarketplaceRegistry } from '@/infrastructure/marketplaces';
import { GeminiAIAdapter, type OfferStyle, type GeminiOfferAnalysis } from '@/infrastructure/ai/providers/gemini.adapter';
import { Product } from '@/core/domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '@/core/domain/value-objects';
import type { ExtractedProductData } from '@/core/domain/ports/marketplaces/IMarketplaceAdapter';

// ─── Public Types ─────────────────────────────────────────────────────────────

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

// ─── Action 1: Extract Real Product Metadata & Confidence Score (Pre-AI) ─────

export async function extractProductDetailsAction(input: {
  url: string;
  affiliateTag?: string;
}): Promise<{ success: true; data: ExtractedProductData; affiliateUrl: string; marketplaceSlug: string } | { success: false; error: string }> {
  try {
    const cleanUrl = sanitizeUrl(input.url);
    if (!cleanUrl || cleanUrl.length < 10) {
      return {
        success: false,
        error: 'Por favor, insira uma URL válida de produto (ex: https://mercadolivre.com.br/... ou https://shopee.com.br/...)'
      };
    }

    console.log('[Scraper] Extraindo metadados reais para:', cleanUrl);
    const registry = initializeMarketplaceRegistry();
    const adapter = registry.getAdapterForUrl(cleanUrl);

    const startTime = Date.now();
    const extracted = await adapter.extractProductData(cleanUrl);
    const duration = Date.now() - startTime;

    console.log(`[Scraper] Concluído em ${duration}ms para ${adapter.marketplaceSlug}. Confiança: ${extracted.confidenceScore}%`);

    const affiliateUrl = await adapter.buildAffiliateLink(cleanUrl, input.affiliateTag || 'mundolk');

    return {
      success: true,
      data: extracted,
      affiliateUrl,
      marketplaceSlug: adapter.marketplaceSlug,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[Scraper Error]:', error);
    return {
      success: false,
      error: `Não foi possível acessar a página do produto: ${error.message}`
    };
  }
}

// ─── Action 2: Generate AI Offer Content from Confirmed Data ──────────────────

export async function analyzeProductUrlAction(input: {
  url:           string;
  affiliateTag?: string;
  userId?:       string;
  style?:        OfferStyle;
  confirmedData?: Partial<ExtractedProductData>;
}): Promise<{ success: true; data: OfferPreview } | { success: false; error: string }> {
  try {
    const cleanUrl = sanitizeUrl(input.url);

    if (!cleanUrl || cleanUrl.length < 10) {
      return {
        success: false,
        error: 'Por favor, insira uma URL válida de produto.'
      };
    }

    console.log('[Action] Analisando oferta para:', cleanUrl);
    const style = input.style ?? 'padrao';
    const registry = initializeMarketplaceRegistry();
    const adapter = registry.getAdapterForUrl(cleanUrl);

    // Re-use confirmed data if provided or scrape
    let extracted = input.confirmedData as ExtractedProductData;
    if (!extracted || !extracted.title) {
      extracted = await adapter.extractProductData(cleanUrl);
    }

    // Safety Gate: If title is empty or unverified (<80% confidence without manual confirmation), request confirmation
    if ((!extracted.title || extracted.confidenceScore < 80) && !input.confirmedData) {
      return {
        success: false,
        error: 'Não foi possível extrair o título e dados reais deste produto com segurança (Confiança < 80%). Por favor, confirme os dados do produto na tela de conferência.'
      };
    }

    const affiliateUrlString = await adapter.buildAffiliateLink(
      cleanUrl,
      input.affiliateTag || 'mundolk'
    );

    const currentPrice  = Price.create(extracted.currentPrice || 0);
    const previousPrice = extracted.previousPrice ? Price.create(extracted.previousPrice) : null;
    const discountPct   = DiscountPercentage.calculate(currentPrice, previousPrice);
    const affiliateLink = AffiliateLink.create(affiliateUrlString);

    const tempProduct = new Product({
      id:                 `preview_${Date.now()}`,
      userId:             input.userId || 'guest',
      title:              extracted.title,
      description:        extracted.description || `Produto oficial ${extracted.brand || ''}`,
      brand:              extracted.brand || 'Desconhecida',
      categoryId:         extracted.categoryName || 'Geral',
      marketplaceSlug:    adapter.marketplaceSlug,
      originalUrl:        extracted.originalUrl || cleanUrl,
      affiliateUrl:       affiliateLink,
      currentPrice,
      previousPrice,
      discountPercentage: discountPct,
      images:             [extracted.mainImage, ...(extracted.gallery || [])].filter(Boolean),
      status:             'ACTIVE',
      createdAt:          new Date(),
      updatedAt:          new Date(),
    });

    console.log('[Gemini] Invocando agente de IA para:', tempProduct.title);
    const geminiAdapter = new GeminiAIAdapter();
    const aiResult      = await geminiAdapter.generateOfferContent(tempProduct, style);

    const copiesData = aiResult.copies?.copies ?? {};
    const whatsAppText  = String(copiesData.whatsAppText || '');
    const telegramText  = String(copiesData.telegramText || '');
    const instagramText = String(copiesData.instagramText || '');
    const facebookText  = String(copiesData.facebookText || '');
    const channelText   = String(copiesData.channelText || '');
    const storyText     = String(copiesData.storyText || '');

    const scoreVal = typeof aiResult.score?.value === 'number' ? aiResult.score.value : 75;
    const scoreLabelStr = scoreVal >= 80 ? 'EXCELLENT' : scoreVal >= 50 ? 'GOOD' : 'REGULAR';
    const justificationStr = String(aiResult.score?.justification || 'Análise da IA finalizada com sucesso.');

    const rawAnalysis = (aiResult as { analysis?: GeminiOfferAnalysis }).analysis;
    const publicoAlvo        = String(rawAnalysis?.publicoAlvo || 'Consumidores em geral');
    const dorQueResolve      = String(rawAnalysis?.dorQueResolve || 'Necessidade de compra com bom custo-benefício');
    const beneficioPrincipal = String(rawAnalysis?.beneficioPrincipal || 'Qualidade e praticidade');
    const argumentoComercial = String(rawAnalysis?.argumentoComercial || `${tempProduct.title} com ótimo preço`);
    const anguloDeVenda      = String(rawAnalysis?.anguloDeVenda || 'Conveniência');
    const emocaoDeCompra     = String(rawAnalysis?.emocaoDeCompra || 'Satisfação');
    const categoria          = String(rawAnalysis?.categoria || tempProduct.categoryId);

    return {
      success: true,
      data: {
        product: {
          id:              tempProduct.id,
          title:           tempProduct.title,
          description:     tempProduct.description,
          brand:           tempProduct.brand,
          price:           currentPrice.formatBRL(),
          priceAmount:     currentPrice.amount,
          previousPrice:   previousPrice?.formatBRL(),
          discountPercent: discountPct.formatString(),
          imageUrl:        extracted.mainImage,
          originalUrl:     extracted.originalUrl || cleanUrl,
          affiliateUrl:    affiliateUrlString,
          marketplaceSlug: adapter.marketplaceSlug,
          categoryId:      categoria,
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
          score:         scoreVal,
          scoreLabel:    scoreLabelStr,
          justification: justificationStr,
          cta:           String(aiResult.cta || 'Aproveite esta oferta!'),
          hashtags:      Array.isArray(aiResult.hashtags) ? aiResult.hashtags.map(String) : ['#oferta'],
          emojis:        Array.isArray(aiResult.emojis) ? aiResult.emojis.map(String) : ['🔥'],
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
    console.error('[analyzeProductUrlAction Exception]:', error);
    return {
      success: false,
      error: `[ERRO NO SERVIDOR]: ${error.message}`
    };
  }
}
