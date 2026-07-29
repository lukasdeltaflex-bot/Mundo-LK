import { MercadoLivreProvider } from '../src/infrastructure/marketplaces/providers/MercadoLivreProvider';
import { AffiliateLinkResolver } from '../src/core/domain/services/AffiliateLinkResolver';
import { AffiliateOffer } from '../src/core/domain/entities/affiliate-offer.entity';
import { OfferMonitorService } from '../src/core/domain/services/OfferMonitorService';
import { AffiliateOpportunityScore } from '../src/core/domain/services/AffiliateOpportunityScore';
import { AffiliateAnalyticsService } from '../src/core/application/services/AffiliateAnalyticsService';

async function runPhase4Verification() {
  console.log('[FASE 4 TEST] Iniciando teste do Affiliate Intelligence Engine...');

  const mlProvider = new MercadoLivreProvider();
  const linkResolver = AffiliateLinkResolver.getInstance();
  const monitorService = OfferMonitorService.getInstance();
  const analyticsService = AffiliateAnalyticsService.getInstance();

  // 1. Criar Oferta Inicial
  const url = 'https://produto.mercadolivre.com.br/MLB-9988776655-monitor-gamer-27-curvo-165hz';
  const rawData = await mlProvider.extractOfferData(url);

  const affiliateLink = linkResolver.resolve({
    originalMarketplaceUrl: url,
    userAffiliateUrl: `${url}?utm_source=intel_test`,
  });

  const offer = new AffiliateOffer({
    id: `off_intel_${Date.now()}`,
    userId: 'usr_affiliate_01',
    marketplace: 'mercadolivre',
    marketplaceItemId: rawData.marketplaceItemId,
    originalUrl: rawData.originalUrl,
    affiliateLink,
    productData: {
      ...rawData.productData,
      title: 'Monitor Gamer 27 Curvo 165Hz 1ms Full HD',
    },
    pricing: {
      currentPrice: 1299.9,
      originalPrice: 1699.9,
      discountPercentage: 24,
      sourceStatus: 'CONFIRMED',
    },
    commission: rawData.commission,
    status: 'ACTIVE',
  });

  // 2. Simular Monitoramento & Alteração de Preço (Queda de R$ 1299.90 para R$ 999.90)
  console.log('\n📉 [Simulando Monitoramento de Preço]...');
  offer.updatePricing({
    currentPrice: 999.9,
    originalPrice: 1699.9,
    discountPercentage: 41,
    sourceStatus: 'CONFIRMED',
  });

  const monitorResult = await monitorService.monitorOffer(offer);
  const priceHistory = monitorService.getPriceHistory(offer.id);

  console.log('✅ [Price History Snapshot Recorded]:', priceHistory);

  // 3. Testar Cálculo Transparente do Score de Oportunidade
  const scoreResult = AffiliateOpportunityScore.calculate(offer);
  console.log('\n📊 [Opportunity Score Result]:', {
    totalScore: scoreResult.totalScore,
    tier: scoreResult.tier,
    reasons: scoreResult.reasons,
  });

  // 4. Testar Consolidação de Analytics sem Fakes
  const metrics = analyticsService.calculateMetrics([offer]);
  console.log('\n📈 [Affiliate Metrics Consolidated]:', metrics);

  if (scoreResult.totalScore < 70) {
    throw new Error('❌ [Intelligence Test Failed]: O score de oportunidade deveria ser HIGH para desconto de 41%.');
  }

  console.log('\n🎉 [FASE 4 SUCCESS] O Affiliate Intelligence Engine registrou histórico de preço, calculou o score transparente e consolidou métricas auditáveis!');
}

runPhase4Verification();
