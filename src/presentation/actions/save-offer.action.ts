'use server';

import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { Product } from '@/core/domain/entities/product.entity';
import { Offer } from '@/core/domain/entities/offer.entity';
import { Price, DiscountPercentage, AffiliateLink } from '@/core/domain/value-objects';
import { ChannelContent } from '@/core/domain/value-objects/channel-content.vo';
import type { OfferPreview } from './analyze-url.action';
import type { ScoreType } from '@/core/domain/value-objects/score-level.vo';

export interface SaveOfferInput {
  preview: OfferPreview;
  userId: string;
  /** Optional user-edited overrides */
  editedTitle?: string;
  editedCta?: string;
}

/**
 * Saves an approved offer (product + offer documents) to Firestore.
 * Called ONLY after the user clicks "Aprovar e Salvar".
 */
export async function saveApprovedOfferAction(
  input: SaveOfferInput
): Promise<{ success: true; productId: string; offerId: string } | { success: false; error: string }> {
  try {
    const { preview, userId, editedTitle, editedCta } = input;
    const productRepo = new FirestoreProductRepository();
    const offerRepo   = new FirestoreOfferRepository();

    console.log('[SAVE] Tentando salvar oferta');
    console.log('[SAVE] Usuário:', userId);

    if (!preview.product.title) throw new Error('Campo obrigatório vazio: Título');
    if (!preview.product.originalUrl) throw new Error('Campo obrigatório vazio: URL Original');
    if (preview.product.priceAmount === undefined || preview.product.priceAmount === null) throw new Error('Campo obrigatório vazio: Preço');

    // ── Build Product entity ────────────────────────────────────────────────
    const currentPrice  = Price.create(preview.product.priceAmount || 0);
    const discountPct   = DiscountPercentage.calculate(currentPrice, null);
    const affiliateLink = AffiliateLink.create(preview.product.affiliateUrl);

    // Stable product ID based on URL + userId (deduplication)
    const urlHash = Buffer.from(preview.product.originalUrl)
      .toString('base64')
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 20);
    const productId = `prod_${urlHash}_${userId.slice(0, 8)}`;

    console.log('[SAVE] Collection: products');
    console.log(`[SAVE] Dados enviados (Produto ${productId}):`, { title: editedTitle || preview.product.title, url: preview.product.originalUrl });

    // Check for existing product (avoid duplicates)
    let product = await productRepo.findByOriginalUrl(preview.product.originalUrl);

    if (!product) {
      product = new Product({
        id:                 productId,
        userId,
        title:              editedTitle || preview.product.title,
        description:        preview.product.description,
        brand:              preview.product.brand,
        categoryId:         preview.product.categoryId,
        marketplaceSlug:    preview.product.marketplaceSlug,
        originalUrl:        preview.product.originalUrl,
        affiliateUrl:       affiliateLink,
        currentPrice,
        previousPrice:      null,
        discountPercentage: discountPct,
        images:             preview.product.imageUrl ? [preview.product.imageUrl] : [],
        status:             'ACTIVE',
        createdAt:          new Date(),
        updatedAt:          new Date(),
      });
    }

    await productRepo.save(product);

    // ── Build Offer entity ──────────────────────────────────────────────────
    const offerId = `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const copies = ChannelContent.create({
      whatsAppText:  preview.offer.whatsAppText,
      telegramText:  preview.offer.telegramText,
      instagramText: preview.offer.instagramText,
      facebookText:  preview.offer.facebookText,
      channelText:   preview.offer.channelText,
    });

    const offer = new Offer({
      id:                 offerId,
      productId:          product.id,
      userId:             userId,
      scoreValue:         preview.offer.score,
      scoreLabel:         preview.offer.scoreLabel as ScoreType,
      scoreJustification: preview.offer.justification,
      copies,
      hashtags:           preview.offer.hashtags,
      emojis:             preview.offer.emojis,
      cta:                editedCta || preview.offer.cta,
      aiProviderUsed:     'gemini-2.5-flash',
      createdAt:          new Date(),
    });

    console.log('[SAVE] Collection: offers');
    console.log(`[SAVE] Dados enviados (Offer ${offerId}):`, { productId: offer.productId, score: offer.scoreValue });

    await offerRepo.save(offer);

    console.log('[SAVE] Oferta criada com sucesso');
    console.log('[SAVE] Documento ID:', offerId);

    return { success: true, productId: product.id, offerId: offer.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SAVE ERROR]', msg);
    console.error(err);
    return { success: false, error: msg || 'Erro ao salvar a oferta.' };
  }
}
