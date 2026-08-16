import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { Product } from '@/core/domain/entities/product.entity';
import { Offer } from '@/core/domain/entities/offer.entity';
import { Price, DiscountPercentage, AffiliateLink } from '@/core/domain/value-objects';
import { ChannelContent } from '@/core/domain/value-objects/channel-content.vo';
import type { OfferPreview } from './analyze-url.action';
import type { ScoreType } from '@/core/domain/value-objects/score-level.vo';

import { UserAIPreferencesService } from '@/core/domain/services/UserAIPreferencesService';

import { CategorySource, ProductMedia } from '@/core/domain/entities/product.entity';

export interface SaveOfferInput {
  preview: OfferPreview;
  userId: string;
  /** Optional user-edited overrides */
  editedTitle?: string;
  editedCta?: string;
  editedCopy?: string;
  editedMedia?: ProductMedia[];
  editedCategory?: string;
  editedCategorySource?: CategorySource;
}

/**
 * Saves an approved offer (product + offer documents) to Firestore.
 * Called ONLY after the user clicks "Aprovar e Salvar".
 */
export async function saveApprovedOfferAction(
  input: SaveOfferInput
): Promise<{ success: true; productId: string; offerId: string } | { success: false; error: string }> {
  try {
    const {
      preview,
      userId,
      editedTitle,
      editedCta,
      editedCopy,
      editedMedia,
      editedCategory,
      editedCategorySource,
    } = input;
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
    const rawUrl        = preview.product.originalUrl;

    // 1. Product Matching Waterfall: Busca se o produto já existe no catálogo do usuário pela URL
    let existingProduct: Product | null = null;
    try {
      if (rawUrl && rawUrl.length > 10) {
        existingProduct = await productRepo.findByOriginalUrl(rawUrl, userId);
      }
    } catch (err) {
      console.warn('[saveApprovedOfferAction] Erro ao buscar produto existente:', err);
    }

    const finalCat = editedCategory || preview.product.categoryId || 'Geral';
    const finalCatSource: CategorySource = editedCategorySource || ((preview.product as any).categorySource as CategorySource) || 'AI';
    const isCatLocked = finalCatSource === 'MANUAL';

    let product: Product;
    if (existingProduct) {
      product = existingProduct;
      if (editedTitle) product.title = editedTitle;

      if (editedCategory || !product.categoryLocked) {
        product.updateCategory({
          categoryId: finalCat,
          source: finalCatSource,
          locked: isCatLocked || product.categoryLocked,
          reasoning: isCatLocked ? 'Categoria definida manualmente pelo usuário na criação da oferta' : undefined,
        });
      }

      if (editedMedia && editedMedia.length > 0) {
        product.updateMedia(editedMedia);
      }
      await productRepo.save(product);
    } else {
      const productId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const imagesArray = editedMedia && editedMedia.length > 0
        ? editedMedia.filter(m => m.type === 'image').map(m => m.url)
        : (preview.product.imageUrl ? [preview.product.imageUrl] : []);

      product = new Product({
        id:                 productId,
        userId,
        title:              editedTitle || preview.product.title,
        description:        preview.product.description || editedCopy || 'Produto oficial',
        brand:              preview.product.brand || 'Desconhecida',
        categoryId:         finalCat,
        categorySource:     finalCatSource,
        categoryLocked:     isCatLocked,
        categoryUpdatedAt:  new Date(),
        categoryReasoning:  isCatLocked ? 'Categoria definida manualmente pelo usuário' : 'Sugestão da IA',
        marketplaceSlug:    preview.product.marketplaceSlug || 'shopee',
        originalUrl:        rawUrl,
        affiliateUrl:       affiliateLink,
        currentPrice,
        previousPrice:      null,
        discountPercentage: discountPct,
        images:             imagesArray,
        media:              editedMedia && editedMedia.length > 0 ? editedMedia : undefined,
        status:             'ACTIVE',
        createdAt:          new Date(),
        updatedAt:          new Date(),
      });

      await productRepo.save(product);
    }

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
