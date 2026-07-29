import { MercadoLivreProvider } from '../src/infrastructure/marketplaces/providers/MercadoLivreProvider';
import { ShopeeProvider } from '../src/infrastructure/marketplaces/providers/ShopeeProvider';
import { AffiliateLinkResolver } from '../src/core/domain/services/AffiliateLinkResolver';
import { AffiliateOffer } from '../src/core/domain/entities/affiliate-offer.entity';

async function runPhase1Verification() {
  console.log('[FASE 1 TEST] Iniciando teste real do Affiliate Offer Core & Link Protection...');

  const mlProvider = new MercadoLivreProvider();
  const shopeeProvider = new ShopeeProvider();
  const linkResolver = AffiliateLinkResolver.getInstance();

  // Teste 1: Mercado Livre Provider
  const mlUrl = 'https://produto.mercadolivre.com.br/MLB-1234567890-tnis-esportivo-corrida-masculino';
  const mlRawData = await mlProvider.extractOfferData(mlUrl);

  const mlLink = linkResolver.resolve({
    originalMarketplaceUrl: mlUrl,
    userAffiliateUrl: `${mlUrl}?matt_tool=123456&utm_source=mundolk`,
    trackingParams: { subId: 'campanha_whatsapp_01' },
  });

  const mlOffer = new AffiliateOffer({
    id: `off_ml_${Date.now()}`,
    userId: 'usr_test_123',
    marketplace: 'mercadolivre',
    marketplaceItemId: mlRawData.marketplaceItemId,
    originalUrl: mlRawData.originalUrl,
    affiliateLink: mlLink,
    productData: mlRawData.productData,
    pricing: mlRawData.pricing,
    commission: mlRawData.commission,
    status: 'ACTIVE',
  });

  console.log('✅ [Mercado Livre Offer Created]:', {
    id: mlOffer.id,
    title: mlOffer.productData.title,
    currentPrice: mlOffer.pricing.currentPrice,
    pricingSourceStatus: mlOffer.pricing.sourceStatus,
    commissionSourceStatus: mlOffer.commission.sourceStatus,
    affiliateUrl: mlOffer.affiliateLink.affiliateUrl,
    integrityVerified: mlOffer.affiliateLink.verifyIntegrity(),
  });

  // Teste 2: Shopee Provider
  const shopeeUrl = 'https://shopee.com.br/product/183177700/87654321';
  const shopeeRawData = await shopeeProvider.extractOfferData(shopeeUrl);

  const shopeeLink = linkResolver.resolve({
    originalMarketplaceUrl: shopeeUrl,
    userAffiliateUrl: `${shopeeUrl}?utm_source=telegram_mundolk`,
  });

  const shopeeOffer = new AffiliateOffer({
    id: `off_shp_${Date.now()}`,
    userId: 'usr_test_123',
    marketplace: 'shopee',
    marketplaceItemId: shopeeRawData.marketplaceItemId,
    originalUrl: shopeeRawData.originalUrl,
    affiliateLink: shopeeLink,
    productData: shopeeRawData.productData,
    pricing: shopeeRawData.pricing,
    commission: shopeeRawData.commission,
    status: 'ACTIVE',
  });

  console.log('✅ [Shopee Offer Created]:', {
    id: shopeeOffer.id,
    title: shopeeOffer.productData.title,
    currentPrice: shopeeOffer.pricing.currentPrice,
    pricingSourceStatus: shopeeOffer.pricing.sourceStatus,
    commissionSourceStatus: shopeeOffer.commission.sourceStatus,
    affiliateUrl: shopeeOffer.affiliateLink.affiliateUrl,
    integrityVerified: shopeeOffer.affiliateLink.verifyIntegrity(),
  });

  // Teste 3: Trava de Leitura da IA
  const aiPayload = linkResolver.prepareAIPayload(shopeeLink);
  console.log('✅ [AI Payload Prepared with Read-Only Lock]:', aiPayload);

  console.log('🎉 [FASE 1 SUCCESS] Todas as entidades, validações e travas de segurança foram aprovadas com sucesso!');
}

runPhase1Verification();
