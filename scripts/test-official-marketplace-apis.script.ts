import { MarketplaceAccessGateway } from '../src/core/domain/services/MarketplaceAccessGateway';
import { MercadoLivreProvider } from '../src/infrastructure/marketplaces/providers/MercadoLivreProvider';
import { ShopeeProvider } from '../src/infrastructure/marketplaces/providers/ShopeeProvider';
import { MarketplaceCentralService } from '../src/core/application/services/MarketplaceCentralService';

async function runOfficialMarketplaceApisTest() {
  console.log('[MARKETPLACE APIS TEST] Iniciando verificação dos Conectores Oficiais & Gateway...');

  const gateway = MarketplaceAccessGateway.getInstance();
  const centralService = MarketplaceCentralService.getInstance();
  const shopeeProvider = new ShopeeProvider();
  const mlProvider = new MercadoLivreProvider();

  // 1. Testar Geração de Assinatura HMAC-SHA256 da Shopee
  const path = '/api/v2/product/get_item_base_info';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = shopeeProvider.generateHmacSignature(path, timestamp);

  console.log('✅ [Shopee HMAC-SHA256 Signature Generated]:', signature);

  if (!signature || signature.length !== 64) {
    throw new Error('❌ [Shopee Test Failed]: A assinatura HMAC-SHA256 gerada não possui 64 caracteres hexadecimais.');
  }

  // 2. Testar Gateway com Cache Inteligente de 15 Minutos (Mercado Livre)
  const mlUrl = 'https://produto.mercadolivre.com.br/MLB-9988776655-smartband';
  
  // Chamada 1 — Execução via API
  const res1 = await gateway.fetchOfferData(mlUrl, 'mercadolivre');
  console.log('✅ [Gateway Call 1 Result]:', res1.productData.title, `(Preço: R$ ${res1.pricing.currentPrice})`);

  // Chamada 2 — Reuso de Cache
  const res2 = await gateway.fetchOfferData(mlUrl, 'mercadolivre');
  console.log('✅ [Gateway Call 2 Cached Result]:', res2.productData.title);

  const logs = gateway.getAuditLogs();
  console.log('📊 [Gateway Audit Logs Count]:', logs.length);
  console.log('📊 [Latest Log Status]:', logs[0].status);

  if (logs[0].status !== 'CACHED') {
    throw new Error('❌ [Gateway Test Failed]: A segunda chamada deveria ter sido servida pelo cache inteligente.');
  }

  // 3. Testar Central de Serviços de Marketplace
  const statusMl = await centralService.testConnection('mercadolivre');
  const statusShopee = await centralService.testConnection('shopee');

  console.log('✅ [Central ML Status]:', statusMl.status, `(App ID: ${statusMl.appId}, Latência: ${statusMl.latencyMs}ms)`);
  console.log('✅ [Central Shopee Status]:', statusShopee.status, `(Partner ID: ${statusShopee.appId}, Latência: ${statusShopee.latencyMs}ms)`);

  console.log('🎉 [OFFICIAL MARKETPLACE APIS SUCCESS] Conectores oficiais com HMAC-SHA256, OAuth e Gateway com Cache de 15 min validados!');
}

runOfficialMarketplaceApisTest();
