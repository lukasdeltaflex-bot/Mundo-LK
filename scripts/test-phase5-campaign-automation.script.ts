import { MercadoLivreProvider } from '../src/infrastructure/marketplaces/providers/MercadoLivreProvider';
import { AffiliateLinkResolver } from '../src/core/domain/services/AffiliateLinkResolver';
import { AffiliateOffer } from '../src/core/domain/entities/affiliate-offer.entity';
import { AffiliateCampaign } from '../src/core/domain/entities/affiliate-campaign.entity';
import { AffiliateCampaignScheduler } from '../src/core/domain/services/AffiliateCampaignScheduler';
import { DailyAffiliateAssistant } from '../src/core/application/services/DailyAffiliateAssistant';

async function runPhase5Verification() {
  console.log('[FASE 5 TEST] Iniciando teste do Campaign Automation Engine & Daily Assistant...');

  const mlProvider = new MercadoLivreProvider();
  const linkResolver = AffiliateLinkResolver.getInstance();
  const scheduler = AffiliateCampaignScheduler.getInstance();
  const assistant = DailyAffiliateAssistant.getInstance();

  // 1. Criar Oferta com Queda de Preço
  const url = 'https://produto.mercadolivre.com.br/MLB-3322110099-fritadeira-air-fryer-inox-5l';
  const rawData = await mlProvider.extractOfferData(url);

  const affiliateLink = linkResolver.resolve({
    originalMarketplaceUrl: url,
    userAffiliateUrl: `${url}?utm_source=phase5_test`,
  });

  const offer = new AffiliateOffer({
    id: `off_cmp_${Date.now()}`,
    userId: 'usr_affiliate_01',
    marketplace: 'mercadolivre',
    marketplaceItemId: rawData.marketplaceItemId,
    originalUrl: rawData.originalUrl,
    affiliateLink,
    productData: rawData.productData,
    pricing: {
      currentPrice: 199.9,
      originalPrice: 299.9,
      discountPercentage: 33,
      sourceStatus: 'CONFIRMED',
    },
    commission: rawData.commission,
    status: 'ACTIVE',
  });

  // 2. Testar Geração do Briefing Matinal do Assistente IA
  console.log('\n☀️ [Gerando Briefing Matinal do Assistente IA]...');
  const briefing = await assistant.generateDailyBriefing('usr_affiliate_01', [offer]);

  console.log('✅ [Greeting Message]:', briefing.greetingMessage);
  console.log('✅ [Draft Campaigns to Approve]:', briefing.draftCampaignsToApprove.length);

  if (briefing.draftCampaignsToApprove.length === 0) {
    throw new Error('❌ [Campaign Test Failed]: O assistente matinal deveria ter gerado um rascunho de campanha para a queda de preço.');
  }

  // 3. Agendar e Executar a Campanha Gerada
  const draftCampaign = briefing.draftCampaignsToApprove[0];
  console.log('\n🗓️ [Agendando & Executando Campanha]:', {
    id: draftCampaign.id,
    name: draftCampaign.name,
    campaignType: draftCampaign.campaignType,
    statusBefore: draftCampaign.status,
  });

  const scheduledTime = new Date(Date.now() + 15 * 60000).toISOString();
  await scheduler.schedule(draftCampaign, scheduledTime);
  console.log('✅ [Status After Scheduling]:', draftCampaign.status);

  const executedCampaign = scheduler.execute(draftCampaign, offer);
  console.log('✅ [Status After Execution]:', executedCampaign.status);

  if (executedCampaign.status !== 'EXECUTED') {
    throw new Error('❌ [Campaign Test Failed]: A campanha deveria transicionar para EXECUTED.');
  }

  console.log('\n🎉 [FASE 5 SUCCESS] O Campaign Automation Engine gerou campanhas por tipo, executou agendamentos e transicionou estados com 100% de aprovação!');
}

runPhase5Verification();
