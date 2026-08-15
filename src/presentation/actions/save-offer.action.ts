'use server';

import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { Product } from '@/core/domain/entities/product.entity';
import { Offer } from '@/core/domain/entities/offer.entity';
import { Price, DiscountPercentage, AffiliateLink } from '@/core/domain/value-objects';
import { ChannelContent } from '@/core/domain/value-objects/channel-content.vo';
import type { OfferPreview } from './analyze-url.action';
import type { ScoreType } from '@/core/domain/value-objects/score-level.vo';

import { UserAIPreferencesService } from '@/core/domain/services/UserAIPreferencesService';

export interface SaveOfferInput {
  preview: OfferPreview;
  userId: string;
  /** Optional user-edited overrides */
  editedTitle?: string;
  editedCta?: string;
  editedCopy?: string;
}

/**
 * Saves an approved offer (product + offer documents) to Firestore.
 * Called ONLY after the user clicks "Aprovar e Salvar".
 */
export async function saveApprovedOfferAction(
  input: SaveOfferInput
): Promise<{ success: true; productId: string; offerId: string } | { success: false; error: string }> {
  try {
    const { preview, userId, editedTitle, editedCta, editedCopy } = input;
    const productRepo = new FirestoreProductRepository();
    const offerRepo   = new FirestoreOfferRepository();

    // Se houve edição manual da copy, registra o aprendizado adaptativo do usuário
    if (editedCopy && editedCopy !== preview.offer.whatsAppText) {
      await UserAIPreferencesService.recordUserEdit(userId, preview.offer.whatsAppText, editedCopy);
    }

    if (!preview.product.title) throw new Error('Campo obrigatório vazio: Título');
    if (!preview.product.originalUrl) throw new Error('Campo obrigatório vazio: URL Original');

    // ── Build Product entity ────────────────────────────────────────────────
    const currentPrice  = Price.create(preview.product.priceAmount || 0);
    const discountPct   = DiscountPercentage.calculate(currentPrice, null);
    const affiliateLink = AffiliateLink.create(preview.product.affiliateUrl || preview.product.originalUrl);

    // Generates a unique product ID per offer creation to guarantee non-colliding catalog persistence
    const productId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const product = new Product({
      id:                 productId,
      userId,
      title:              editedTitle || preview.product.title,
      description:        preview.product.description || editedCopy || 'Produto oficial',
      brand:              preview.product.brand || 'Desconhecida',
      categoryId:         preview.product.categoryId || 'Geral',
      marketplaceSlug:    preview.product.marketplaceSlug || 'shopee',
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

    await productRepo.save(product);

    // ── Build Offer entity via CreateOfferUseCase ───────────────────────────
    const finalWhatsApp = editedCopy || preview.offer.whatsAppText;
    const copies = ChannelContent.create({
      whatsAppText:  finalWhatsApp,
      telegramText:  preview.offer.telegramText || finalWhatsApp,
      instagramText: preview.offer.instagramText || finalWhatsApp,
      facebookText:  preview.offer.facebookText || finalWhatsApp,
      channelText:   preview.offer.channelText || finalWhatsApp,
    });

    const mktSlug = preview.product.marketplaceSlug || 'shopee';
    const mktNameMap: Record<string, string> = {
      shopee: 'Shopee',
      mercadolivre: 'Mercado Livre',
      amazon: 'Amazon',
      magalu: 'Magalu',
      aliexpress: 'AliExpress',
      tiktokshop: 'TikTok Shop',
      shein: 'Shein',
    };
    const mktName = (preview.product as any).marketplaceName || mktNameMap[mktSlug.toLowerCase()] || mktSlug;

    const { CreateOfferUseCase } = await import('@/core/application/use-cases/offers/CreateOfferUseCase');
    const createOfferUseCase = new CreateOfferUseCase(offerRepo, productRepo);

    const createdOffer = await createOfferUseCase.execute({
      product,
      userId,
      scoreValue: preview.offer.score,
      scoreLabel: (preview.offer.scoreLabel as ScoreType) || 'GOOD',
      scoreJustification: preview.offer.justification,
      copies,
      hashtags: preview.offer.hashtags,
      emojis: preview.offer.emojis,
      cta: editedCta || preview.offer.cta,
      aiProviderUsed: 'gemini-1.5-flash',
      marketplaceId: mktSlug,
      marketplaceName: mktName,
      marketplaceDetectedBy: (preview.product as any).marketplaceDetectedBy || 'url_parser',
    });

    console.log('[SAVE] Nova oferta criada com sucesso via UseCase! OfferId:', createdOffer.id, '| Marketplace:', mktSlug);

    return { success: true, productId: product.id, offerId: createdOffer.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SAVE ERROR]', msg);
    return { success: false, error: msg || 'Erro ao salvar a oferta.' };
  }
}
