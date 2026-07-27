import { expandShortenedUrl } from '../src/infrastructure/marketplaces/scraper/product-page-scraper';
import { MarketplaceRegistry } from '../src/infrastructure/marketplaces/registry/MarketplaceRegistry';
import { ProductIdentityResolver } from '../src/core/domain/services/ProductIdentityResolver';
import { ProviderManager } from '../src/infrastructure/marketplaces/providers/ProviderManager';
import { CacheService } from '../src/infrastructure/cache/CacheService';
import { ConfidenceService } from '../src/infrastructure/marketplaces/services/ConfidenceService';
import { ProductKnowledgeBuilder } from '../src/infrastructure/ai/services/ProductKnowledgeBuilder';
import { AIPromptBuilder } from '../src/infrastructure/ai/services/AIPromptBuilder';

async function testRealShopeeExtraction(testUrl: string) {
  console.log('==================================================');
  console.log('🧪 TESTE REAL DE EXTRAÇÃO - MUNDO LK ENTERPRISE');
  console.log('==================================================');
  console.log(`[Input] URL Recebida: ${testUrl}\n`);

  const startTime = Date.now();

  // 1. Expansão de link curto
  const expandedUrl = await expandShortenedUrl(testUrl);
  console.log(`[1. Expansão] URL Expandida: ${expandedUrl}`);

  // 2. Identificação de Marketplace
  const registry = new MarketplaceRegistry();
  const plugin = registry.getPluginForUrl(expandedUrl);
  console.log(`[2. Marketplace] Identificado: ${plugin.name} (${plugin.slug})`);

  // 3. Resolução de Product ID Canônico
  const identityResolver = new ProductIdentityResolver(registry);
  const identity = identityResolver.resolveCanonicalKey(expandedUrl);
  console.log(`[3. Identidade Canônica] Canonical Key: ${identity.canonicalKey} (Product ID: ${identity.productId})`);

  // 4. Consulta ao Cache
  const cacheService = new CacheService();
  const cached = await cacheService.getCachedProduct(identity.canonicalKey);
  const cacheStatus = cached ? (cached.isPriceStale ? 'Stale Hit' : 'Hit') : 'Miss';
  console.log(`[4. Cache] Status: ${cacheStatus} ${cached ? `(Tier: ${cached.tier})` : ''}`);

  // 5. Execução do ProviderManager Waterfall (se Miss ou Stale)
  const providerManager = new ProviderManager();
  let extractionResult;
  let providerUsed = 'Cache';
  let totalDurationMs = Date.now() - startTime;

  if (!cached || cached.isPriceStale) {
    const provResult = await providerManager.extract(expandedUrl, plugin.slug);
    providerUsed = provResult.providerName;
    totalDurationMs = provResult.durationMs;
    const rawData = provResult.data || {};
    extractionResult = plugin.normalize(rawData, testUrl, expandedUrl);
  } else {
    extractionResult = cached.product;
  }

  // 6. Confidence Score
  const confidenceService = new ConfidenceService();
  const confidenceReport = confidenceService.calculateConfidence(extractionResult);
  console.log(`[6. Confiança] Score: ${confidenceReport.score}% (Requer confirmação? ${confidenceReport.requiresConfirmation})`);

  // 7. Product Knowledge Sheet
  const knowledgeBuilder = new ProductKnowledgeBuilder();
  const knowledge = knowledgeBuilder.buildKnowledgeSheet(extractionResult);

  // 8. AI Prompt Builder
  const promptBuilder = new AIPromptBuilder();
  const aiPromptPayload = promptBuilder.buildJSONPrompt(knowledge, 'padrao');

  console.log('\n==================================================');
  console.log('📋 RELATÓRIO FINAL DE EXTRAÇÃO REAL');
  console.log('==================================================');
  console.log(`Marketplace:              ${plugin.name}`);
  console.log(`URL expandida:            ${expandedUrl}`);
  console.log(`URL canônica:             ${identity.canonicalKey}`);
  console.log(`Product ID:               ${identity.productId}`);
  console.log(`Nome real do produto:     ${extractionResult.title || '— Não encontrado'}`);
  console.log(`Marca:                    ${extractionResult.brand || '— Não informada'}`);
  console.log(`Categoria:                ${extractionResult.category || 'Geral'}`);
  console.log(`Preço atual (R$):         ${extractionResult.currentPrice ? `R$ ${extractionResult.currentPrice.toFixed(2)}` : '— Não encontrado'}`);
  console.log(`Preço anterior (R$):      ${extractionResult.originalPrice ? `R$ ${extractionResult.originalPrice.toFixed(2)}` : '— Sem preço anterior'}`);
  console.log(`Desconto:                 ${extractionResult.discountPercentage}%`);
  console.log(`Frete:                    ${extractionResult.shippingType}`);
  console.log(`Loja:                     ${extractionResult.sellerName || '—'}`);
  console.log(`Avaliação:                ${extractionResult.rating || '—'}`);
  console.log(`Quantidade de avaliações: ${extractionResult.reviewCount || 0}`);
  console.log(`Quantidade vendida:       ${extractionResult.soldQuantity || '—'}`);
  console.log(`Imagem principal:         ${extractionResult.image || '—'}`);
  console.log(`Score de confiança:       ${confidenceReport.score}%`);
  console.log(`Provider utilizado:       ${providerUsed}`);
  console.log(`Tempo de resposta:        ${totalDurationMs}ms`);
  console.log(`Cache:                    ${cacheStatus}`);
  console.log('==================================================\n');

  console.log('📦 PROMPT ESTRUTURADO PARA O GEMINI (SEM HTML):');
  console.log(aiPromptPayload);
}

const testUrl = process.argv[2] || 'https://s.shopee.com.br/3Viqezp8fk?share_channel_code=1';
testRealShopeeExtraction(testUrl).catch((err) => {
  console.error('❌ Erro no teste:', err);
});
