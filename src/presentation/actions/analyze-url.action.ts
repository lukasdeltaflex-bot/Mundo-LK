'use server';

import { initializeMarketplaceRegistry } from '@/infrastructure/marketplaces';
import { AIProviderFactory } from '@/infrastructure/ai/factory/ai-provider.factory';
import { Product } from '@/core/domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '@/core/domain/value-objects';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfferPreview {
  /** Serialized product data (plain object, safe for client-side) */
  product: {
    id: string;
    title: string;
    description: string;
    brand: string;
    price: string;          // formatted BRL
    priceAmount: number;    // raw number for saving
    previousPrice?: string;
    discountPercent: string;
    imageUrl: string;
    originalUrl: string;
    affiliateUrl: string;
    marketplaceSlug: string;
    categoryId: string;
  };
  /** Generated AI offer content */
  offer: {
    score: number;
    scoreLabel: string;
    justification: string;
    cta: string;
    hashtags: string[];
    emojis: string[];
    whatsAppText: string;
    telegramText: string;
    instagramText: string;
    facebookText: string;
    channelText: string;
  };
}

// ─── Action ───────────────────────────────────────────────────────────────────

/**
 * Analyzes a product URL and generates an offer preview.
 * DOES NOT save anything to Firestore — purely read + AI generation.
 */
export async function analyzeProductUrlAction(input: {
  url: string;
  affiliateTag?: string;
  userId?: string;
}): Promise<{ success: true; data: OfferPreview } | { success: false; error: string }> {
  try {
    const registry = initializeMarketplaceRegistry();
    const aiProvider = AIProviderFactory.getProvider('gemini');

    // 1. Resolve adapter
    const adapter = registry.getAdapterForUrl(input.url);

    // 2. Extract real product data from URL
    const extracted = await adapter.extractProductData(input.url);

    // 3. Build affiliate URL
    const affiliateUrlString = await adapter.buildAffiliateLink(
      input.url,
      input.affiliateTag || 'mundolk'
    );

    // 4. Construct temporary Product entity (not persisted)
    const currentPrice    = Price.create(extracted.currentPrice || 0);
    const previousPrice   = extracted.previousPrice ? Price.create(extracted.previousPrice) : null;
    const discountPct     = DiscountPercentage.calculate(currentPrice, previousPrice);
    const affiliateLink   = AffiliateLink.create(affiliateUrlString);

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

    // 5. Generate AI offer content (no save)
    const aiResult = await aiProvider.generateOfferContent(tempProduct);

    // 6. Return serialized preview (plain objects, no class instances)
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
          categoryId:      extracted.categoryName || 'Geral',
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
        },
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[analyzeProductUrlAction]', msg);
    return { success: false, error: msg || 'Erro ao analisar o produto.' };
  }
}
