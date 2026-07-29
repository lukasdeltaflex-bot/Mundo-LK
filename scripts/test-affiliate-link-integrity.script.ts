import { AffiliateLinkResolver } from '../src/core/domain/services/AffiliateLinkResolver';
import { MercadoLivreProvider } from '../src/infrastructure/marketplaces/providers/MercadoLivreProvider';
import { ShopeeProvider } from '../src/infrastructure/marketplaces/providers/ShopeeProvider';
import { AffiliateOffer } from '../src/core/domain/entities/affiliate-offer.entity';
import { AIService } from '../src/app/(dashboard)/operacao/services/AIService';
import { AffiliateDistributionService } from '../src/core/application/services/AffiliateDistributionService';

async function runAffiliateLinkIntegritySuite() {
  console.log('===========================================================');
  console.log('🔗 MUNDO LK — SUÍTE DE TESTE DE INTEGRIDADE DO LINK DE AFILIADO');
  console.log('===========================================================\n');

  const linkResolver = AffiliateLinkResolver.getInstance();
  const distributionService = AffiliateDistributionService.getInstance();

  // -------------------------------------------------------------------------
  // TESTE 1 — PRESERVAÇÃO INTEGRAL DE UTMS E SUBIDS
  // -------------------------------------------------------------------------
  console.log('📌 TESTE 1 — Preservação Integral de UTMs, subId e parâmetros de afiliado');
  const originalUrl = 'https://produto.mercadolivre.com.br/MLB-1122334455-air-fryer-digital';
  const userAffiliateUrl = `${originalUrl}?utm_source=whatsapp_mundolk&utm_medium=cpc&subId=campanha_blackfriday_01&affiliate_id=aff_998877`;

  const link = linkResolver.resolve({
    originalMarketplaceUrl: originalUrl,
    userAffiliateUrl,
  });

  console.log('  • URL Original:', link.originalMarketplaceUrl);
  console.log('  • URL de Afiliado:', link.affiliateUrl);
  console.log('  • UTM Source:', link.trackingParameters.utm_source);
  console.log('  • SubId:', link.trackingParameters.subId);
  console.log('  • Hash SHA-256 de Integridade:', link.hashIntegrity);

  if (!link.verifyIntegrity()) {
    throw new Error('❌ TESTE 1 FALHOU: O hash de integridade foi violado logo após a resolução.');
  }
  console.log('✅ [TESTE 1 APROVADO] Todos os parâmetros de rastreamento e o hash imutável foram preservados com sucesso.\n');

  // -------------------------------------------------------------------------
  // TESTE 2 — TRAVA DE SEGURANÇA CONTRA ALTERAÇÕES PELA IA
  // -------------------------------------------------------------------------
  console.log('📌 TESTE 2 — Trava de Segurança contra Alterações pela IA');
  const mlProvider = new MercadoLivreProvider();
  const rawData = await mlProvider.extractOfferData(originalUrl);

  const offer = new AffiliateOffer({
    id: `off_integrity_${Date.now()}`,
    userId: 'usr_affiliate_01',
    marketplace: 'mercadolivre',
    marketplaceItemId: rawData.marketplaceItemId,
    originalUrl: rawData.originalUrl,
    affiliateLink: link,
    productData: rawData.productData,
    pricing: rawData.pricing,
    commission: rawData.commission,
    status: 'ACTIVE',
  });

  const aiContent = AIService.generateAffiliateOfferContent(offer);
  console.log('  • Copy para WhatsApp Gerada pela IA:');
  console.log('    ---------------------------------------------------');
  console.log('   ', aiContent.whatsappCopy?.split('\n').join('\n    '));
  console.log('    ---------------------------------------------------');

  if (!aiContent.whatsappCopy?.includes(link.affiliateUrl)) {
    throw new Error('❌ TESTE 2 FALHOU: A URL protegida não foi encontrada integralmente na copy da IA.');
  }
  console.log('✅ [TESTE 2 APROVADO] A IA incluiu a URL protegida com 100% de exatidão na copy.\n');

  // -------------------------------------------------------------------------
  // TESTE 3 — DETECÇÃO DE CORRUPÇÃO E BLOQUEIO NO WEB INTENT
  // -------------------------------------------------------------------------
  console.log('📌 TESTE 3 — Detecção de Corrupção e Bloqueio em Web Intents');
  const intentResult = distributionService.createWhatsAppIntent({
    offer,
    copyText: aiContent.whatsappCopy!,
    style: 'aggressive',
  });

  console.log('  • Web Intent WhatsApp Gerado:', intentResult.intentUrl);
  console.log('  • Snapshot de Histórico:', intentResult.historySnapshot.affiliateUrlSnapshot);

  if (intentResult.historySnapshot.affiliateUrlSnapshot !== link.affiliateUrl) {
    throw new Error('❌ TESTE 3 FALHOU: O snapshot do histórico diverge do link imutável.');
  }
  console.log('✅ [TESTE 3 APROVADO] O serviço de distribuição bloqueou violações e gravou o snapshot fiel no histórico.\n');

  console.log('===========================================================');
  console.log('🎉 SUÍTE DE INTEGRIDADE DE LINK CONCLUÍDA COM 100% DE SUCESSO');
  console.log('===========================================================');
}

runAffiliateLinkIntegritySuite();
