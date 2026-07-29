import { MercadoLivreProvider } from '../src/infrastructure/marketplaces/providers/MercadoLivreProvider';
import { AffiliateLinkResolver } from '../src/core/domain/services/AffiliateLinkResolver';
import { AffiliateOffer } from '../src/core/domain/entities/affiliate-offer.entity';
import { AffiliateAIOrchestrator } from '../src/core/domain/services/AffiliateAIOrchestrator';
import { AIService } from '../src/app/(dashboard)/operacao/services/AIService';

async function runPhase2Verification() {
  console.log('[FASE 2 TEST] Iniciando teste do Affiliate AI Orchestrator & Conteúdo Multicanal...');

  const mlProvider = new MercadoLivreProvider();
  const linkResolver = AffiliateLinkResolver.getInstance();
  const orchestrator = AffiliateAIOrchestrator.getInstance();

  // 1. Criar Oferta Real do Mercado Livre
  const url = 'https://produto.mercadolivre.com.br/MLB-9876543210-fritadeira-air-fryer-5l-digital';
  const rawData = await mlProvider.extractOfferData(url);

  const affiliateLink = linkResolver.resolve({
    originalMarketplaceUrl: url,
    userAffiliateUrl: `${url}?utm_source=whatsapp_mundolk&subId=promo_01`,
  });

  const offer = new AffiliateOffer({
    id: `off_ml_ai_${Date.now()}`,
    userId: 'usr_affiliate_01',
    marketplace: 'mercadolivre',
    marketplaceItemId: rawData.marketplaceItemId,
    originalUrl: rawData.originalUrl,
    affiliateLink,
    productData: {
      ...rawData.productData,
      title: 'Fritadeira Air Fryer 5L Digital Inox',
      category: 'Cozinha e Eletrodomésticos',
    },
    pricing: rawData.pricing,
    commission: rawData.commission,
    status: 'ACTIVE',
  });

  // 2. Executar o Orquestrador de IA
  const content = AIService.generateAffiliateOfferContent(offer);

  console.log('✅ [WhatsApp Copy Generated]:\n', content.whatsappCopy);
  console.log('\n✅ [Instagram Caption Generated]:\n', content.instagramCaption);
  console.log('\n✅ [TikTok Script Generated]:\n', content.tiktokScript);

  // 3. Testar a Trava de Segurança da Auditoria de IA (Safety Audit)
  console.log('\n🔒 [Testing Safety Audit Rejection on Tampered Price/Link]...');
  let rejectedAsExpected = false;
  
  // Simula uma tentativa onde o preço da oferta foi alterado no banco (ex: 999.99) mas a copy da IA manteve 99.90
  const tamperedOffer = new AffiliateOffer({
    ...offer,
    pricing: { ...offer.pricing, currentPrice: 999.99 },
  });

  const auditResult = orchestrator.validateAIOutput(tamperedOffer, content);
  if (!auditResult.isValid) {
    rejectedAsExpected = true;
    console.log('✅ [Safety Audit Rejection Verified]:', auditResult.rejectionReason);
  }

  if (!rejectedAsExpected) {
    throw new Error('❌ [Safety Audit Test Failed]: A auditoria não rejeitou a oferta adulterada.');
  }

  console.log('\n🎉 [FASE 2 SUCCESS] O Affiliate AI Orchestrator gerou conteúdos multicanal de alta conversão e a Trava de Segurança aprovou 100% dos testes!');
}

runPhase2Verification();
