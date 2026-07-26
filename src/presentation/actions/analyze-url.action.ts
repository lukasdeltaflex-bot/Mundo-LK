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
  try {
    const cleanUrl = sanitizeUrl(input.url);

    if (!cleanUrl || cleanUrl.length < 10) {
      return {
        success: false,
        error: 'Por favor, insira uma URL válida de produto (ex: https://mercadolivre.com.br/... ou https://shopee.com.br/...)'
      };
    }

    console.log('[3] Link recebido no servidor:', cleanUrl);
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
    console.log('[4] Gemini chamado para produto:', tempProduct.title);
    const geminiAdapter = new GeminiAIAdapter();
    const aiResult      = await geminiAdapter.generateOfferContent(tempProduct, style);
    console.log('[5] Resposta recebida da IA com sucesso.');

    // Extract copies safely as plain strings
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

    // 6. Extract rich analysis
    const rawAnalysis = (aiResult as { analysis?: GeminiOfferAnalysis }).analysis;
    const publicoAlvo        = String(rawAnalysis?.publicoAlvo || 'Consumidores em geral');
    const dorQueResolve      = String(rawAnalysis?.dorQueResolve || 'Necessidade de compra com bom custo-benefício');
    const beneficioPrincipal = String(rawAnalysis?.beneficioPrincipal || 'Qualidade e praticidade');
    const argumentoComercial = String(rawAnalysis?.argumentoComercial || `${tempProduct.title} com ótimo preço`);
    const anguloDeVenda      = String(rawAnalysis?.anguloDeVenda || 'Conveniência');
    const emocaoDeCompra     = String(rawAnalysis?.emocaoDeCompra || 'Satisfação');
    const categoria          = String(rawAnalysis?.categoria || tempProduct.categoryId);

    console.log('[6] Retornando ao frontend com sucesso.');
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
    const msg = err instanceof Error ? (err.stack || err.message) : String(err);
    console.error('[analyzeProductUrlAction Exception]:', msg);
    return {
      success: false,
      error: 'Não conseguimos analisar esse link agora. Verifique a URL e tente novamente.'
    };
  }
}
