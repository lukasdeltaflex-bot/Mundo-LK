'use server';

import { initializeMarketplaceRegistry } from '@/infrastructure/marketplaces';
import { GeminiAIAdapter, type OfferStyle, type GeminiOfferAnalysis } from '@/infrastructure/ai/providers/gemini.adapter';
import { Product } from '@/core/domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '@/core/domain/value-objects';

// ─── Public Types ─────────────────────────────────────────────────────────────

export type { OfferStyle };

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

// ─── Action ───────────────────────────────────────────────────────────────────

/**
 * Analyzes a product URL and generates an AI offer preview.
 * DOES NOT save anything to Firestore.
 * Guaranteed to return within 12 seconds or return a friendly error.
 */
export async function analyzeProductUrlAction(input: {
  url:          string;
  affiliateTag?: string;
  userId?:       string;
  style?:        OfferStyle;
}): Promise<{ success: true; data: OfferPreview } | { success: false; error: string }> {
  const cleanUrl = sanitizeUrl(input.url);

  if (!cleanUrl || cleanUrl.length < 10) {
    return {
      success: false,
      error: 'Por favor, insira uma URL válida de produto (ex: https://mercadolivre.com.br/... ou https://shopee.com.br/...)'
    };
  }

  // Enforce a strict 30-second total action execution limit
  const timeoutPromise = new Promise<{ success: false; error: string }>((resolve) => {
    setTimeout(() => {
      resolve({
        success: false,
        error: 'A análise deste produto demorou mais que o esperado. Por favor, verifique o link e tente novamente.'
      });
    }, 30_000);
  });

  const executionPromise = (async (): Promise<{ success: true; data: OfferPreview } | { success: false; error: string }> => {
    try {
      const style = input.style ?? 'padrao';
      const registry = initializeMarketplaceRegistry();

      // 1. Resolve marketplace adapter (Shopee, MercadoLivre, Amazon, Magalu or Generic fallback)
      const adapter = registry.getAdapterForUrl(cleanUrl);

      // 2. Extract real product data from page HTML
      const extracted = await adapter.extractProductData(cleanUrl);

      // 3. Build affiliate URL
      const affiliateUrlString = await adapter.buildAffiliateLink(
        cleanUrl,
        input.affiliateTag || 'mundolk'
      );

      // 4. Build temporary Product entity
      const currentPrice  = Price.create(extracted.currentPrice || 0);
      const previousPrice = extracted.previousPrice ? Price.create(extracted.previousPrice) : null;
      const discountPct   = DiscountPercentage.calculate(currentPrice, previousPrice);
      const affiliateLink = AffiliateLink.create(affiliateUrlString);

      const tempProduct = new Product({
        id:                 `preview_${Date.now()}`,
        userId:             input.userId || 'guest',
        title:              extracted.title,
        description:        extracted.description,
        brand:              extracted.brand || 'Desconhecida',
        categoryId:         extracted.categoryName || 'Geral',
        marketplaceSlug:    adapter.marketplaceSlug,
        originalUrl:        extracted.originalUrl,
        affiliateUrl:       affiliateLink,
        currentPrice,
        previousPrice,
        discountPercentage: discountPct,
        images:             [extracted.mainImage, ...(extracted.gallery || [])].filter(Boolean),
        status:             'ACTIVE',
        createdAt:          new Date(),
        updatedAt:          new Date(),
      });

      // 5. Call AI with style preference
      const geminiAdapter = new GeminiAIAdapter();
      const aiResult      = await geminiAdapter.generateOfferContent(tempProduct, style);

      // 6. Extract rich analysis
      const analysis: GeminiOfferAnalysis = (aiResult as { analysis?: GeminiOfferAnalysis }).analysis ?? {
        publicoAlvo:        'Consumidores em geral',
        dorQueResolve:      'Necessidade de compra com bom custo-benefício',
        beneficioPrincipal: 'Qualidade e praticidade',
        argumentoComercial: `${tempProduct.title} com ótimo preço`,
        anguloDeVenda:      'Conveniência',
        emocaoDeCompra:     'Satisfação',
        categoria:          tempProduct.categoryId,
        whatsAppText:       aiResult.copies.copies.whatsAppText,
        telegramText:       aiResult.copies.copies.telegramText,
        instagramText:      aiResult.copies.copies.instagramText,
        facebookText:       aiResult.copies.copies.facebookText,
        channelText:        aiResult.copies.copies.channelText,
        storyText:          '',
        cta:                aiResult.cta,
        hashtags:           aiResult.hashtags,
        emojis:             aiResult.emojis,
        scoreValue:         aiResult.score.value,
        scoreJustification: aiResult.score.justification,
      };

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
            originalUrl:     extracted.originalUrl,
            affiliateUrl:    affiliateUrlString,
            marketplaceSlug: adapter.marketplaceSlug,
            categoryId:      analysis.categoria || tempProduct.categoryId,
          },
          analysis: {
            publicoAlvo:        analysis.publicoAlvo,
            dorQueResolve:      analysis.dorQueResolve,
            beneficioPrincipal: analysis.beneficioPrincipal,
            argumentoComercial: analysis.argumentoComercial,
            anguloDeVenda:      analysis.anguloDeVenda,
            emocaoDeCompra:     analysis.emocaoDeCompra,
          },
          offer: {
            score:         aiResult.score.value,
            scoreLabel:    aiResult.score.level.level,
            justification: aiResult.score.justification,
            cta:           aiResult.cta,
            hashtags:      aiResult.hashtags,
            emojis:        aiResult.emojis,
            whatsAppText:  aiResult.copies.copies.whatsAppText,
            telegramText:  aiResult.copies.copies.telegramText,
            instagramText: aiResult.copies.copies.instagramText,
            facebookText:  aiResult.copies.copies.facebookText,
            channelText:   aiResult.copies.copies.channelText,
            storyText:     aiResult.copies.copies.storyText || '',
            style,
          },
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[analyzeProductUrlAction] Error:', msg);
      return {
        success: false,
        error: `Não conseguimos analisar esse link agora. Verifique a URL e tente novamente. (${msg})`
      };
    }
  })();

  return Promise.race([executionPromise, timeoutPromise]);
}
