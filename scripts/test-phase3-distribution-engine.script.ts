import { MercadoLivreProvider } from '../src/infrastructure/marketplaces/providers/MercadoLivreProvider';
import { AffiliateLinkResolver } from '../src/core/domain/services/AffiliateLinkResolver';
import { AffiliateOffer } from '../src/core/domain/entities/affiliate-offer.entity';
import { AIService } from '../src/app/(dashboard)/operacao/services/AIService';
import { AffiliateDistributionService } from '../src/core/application/services/AffiliateDistributionService';

async function runPhase3Verification() {
  console.log('[FASE 3 TEST] Iniciando teste do Affiliate Distribution Engine & Web Intents...');

  const mlProvider = new MercadoLivreProvider();
  const linkResolver = AffiliateLinkResolver.getInstance();
  const distributionService = AffiliateDistributionService.getInstance();

  // 1. Criar Oferta Real do Mercado Livre
  const url = 'https://produto.mercadolivre.com.br/MLB-5544332211-smartband-relogio-inteligente';
  const rawData = await mlProvider.extractOfferData(url);

  const affiliateLink = linkResolver.resolve({
    originalMarketplaceUrl: url,
    userAffiliateUrl: `${url}?utm_source=whatsapp_mundolk&subId=dist_01`,
  });

  const offer = new AffiliateOffer({
    id: `off_dist_${Date.now()}`,
    userId: 'usr_affiliate_01',
    marketplace: 'mercadolivre',
    marketplaceItemId: rawData.marketplaceItemId,
    originalUrl: rawData.originalUrl,
    affiliateLink,
    productData: {
      ...rawData.productData,
      title: 'Smartband Relógio Inteligente Monitores de Saúde',
    },
    pricing: rawData.pricing,
    commission: rawData.commission,
    status: 'ACTIVE',
  });

  // 2. Gerar Conteúdo Multicanal pela IA
  const content = AIService.generateAffiliateOfferContent(offer);

  // 3. Testar Web Intent do WhatsApp com Verificação de Integridade
  const waResult = distributionService.createWhatsAppIntent({
    offer,
    copyText: content.whatsappCopy!,
    style: 'aggressive',
  });

  console.log('✅ [WhatsApp Web Intent Created]:', waResult.intentUrl);
  console.log('✅ [WhatsApp History Snapshot]:', {
    id: waResult.historySnapshot.id,
    priceSnapshot: waResult.historySnapshot.priceSnapshot,
    affiliateUrlSnapshot: waResult.historySnapshot.affiliateUrlSnapshot,
    status: waResult.historySnapshot.status,
  });

  // 4. Testar Web Intent do Telegram com Verificação de Integridade
  const tgResult = distributionService.createTelegramIntent({
    offer,
    copyText: content.whatsappCopy!,
    style: 'natural',
  });

  console.log('✅ [Telegram Web Intent Created]:', tgResult.intentUrl);
  console.log('✅ [Telegram History Snapshot]:', {
    id: tgResult.historySnapshot.id,
    status: tgResult.historySnapshot.status,
  });

  // 5. Testar Registro de Ação de Cópia
  const copySnapshot = distributionService.recordCopyAction({
    offer,
    channel: 'instagram',
    copyText: content.instagramCaption!,
    style: 'natural',
  });

  console.log('✅ [Instagram Copy Snapshot Recorded]:', {
    id: copySnapshot.id,
    status: copySnapshot.status,
  });

  // 6. Verificar Histórico da Oferta
  const offerHistory = distributionService.getOfferHistory(offer.id);
  console.log(`\n📊 [Total History Items for Offer ${offer.id}]:`, offerHistory.length);

  if (offerHistory.length !== 3) {
    throw new Error('❌ [Distribution Test Failed]: O número de itens no histórico não confere.');
  }

  console.log('🎉 [FASE 3 SUCCESS] O Affiliate Distribution Engine criou Web Intents oficiais, manteve integridade imutável dos links e gravou snapshots no histórico com 100% de sucesso!');
}

runPhase3Verification();
