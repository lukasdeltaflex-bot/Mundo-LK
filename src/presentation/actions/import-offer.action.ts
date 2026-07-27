
import { ImportAndGenerateOfferWorkflow } from '@/core/application/workflows/ImportAndGenerateOfferWorkflow';
import { initializeMarketplaceRegistry } from '@/infrastructure/marketplaces';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { AIProviderFactory } from '@/infrastructure/ai/factory/ai-provider.factory';
import { EventBusService } from '@/infrastructure/events/event-bus.service';

export interface ImportOfferActionInput {
  url: string;
  affiliateTag?: string;
  /** UID do usuário autenticado — deve ser passado pelo client */
  userId?: string;
}

export async function importAndGenerateOfferAction(input: ImportOfferActionInput) {
  try {
    const registry = initializeMarketplaceRegistry();
    const productRepo = new FirestoreProductRepository();
    const offerRepo = new FirestoreOfferRepository();
    const aiProvider = AIProviderFactory.getProvider('gemini');
    const eventBus = EventBusService.getInstance();

    const workflow = new ImportAndGenerateOfferWorkflow(
      registry,
      productRepo,
      offerRepo,
      aiProvider,
      eventBus
    );

    const result = await workflow.execute({
      url: input.url,
      // Use the real userId when provided; fall back to a stable guest key
      userId: input.userId || 'guest',
      affiliateTag: input.affiliateTag,
    });

    return {
      success: true,
      data: {
        productId:     result.product.id,
        offerId:       result.offer.id,
        title:         result.product.title,
        price:         result.product.currentPrice.formatBRL(),
        score:         result.offer.scoreValue,
        scoreLabel:    result.offer.scoreLabel,
        whatsappText:  result.offer.copies.copies.whatsAppText,
        telegramText:  result.offer.copies.copies.telegramText,
        instagramText: result.offer.copies.copies.instagramText,
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[importAndGenerateOfferAction] Error:', err.message);
    return {
      success: false,
      error: err.message || 'Falha ao importar produto e gerar oferta.',
    };
  }
}
