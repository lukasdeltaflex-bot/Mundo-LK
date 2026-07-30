/**
 * Script de Validação da Fase 2.5 — Marketplace Personality Intelligence
 * Testa: MarketplaceProfileService, MarketplaceMentionPolicy (NEVER/ALWAYS/AUTO),
 *        purchaseConfidenceScore, PositiveAIMemoryService, AIContextBuilder.buildEnrichedBrainPayload
 */

import { MarketplaceProfileService } from '../src/core/domain/services/MarketplaceProfileService';
import { MarketplaceMentionPolicy } from '../src/core/domain/services/MarketplaceMentionPolicy';
import { MarketplaceIntelligenceScore } from '../src/core/domain/value-objects/MarketplaceIntelligenceScore';
import { AffiliateTrustContextService } from '../src/core/domain/services/AffiliateTrustContextService';
import { AIContextBuilder } from '../src/infrastructure/ai/services/AIContextBuilder';
import { ProductExtractionResult } from '../src/core/domain/entities/ProductExtractionResult';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FALHOU: ${label}`);
    failed++;
  }
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🧪 FASE 2.5 — MARKETPLACE PERSONALITY INTELLIGENCE — VALIDAÇÃO');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // ─── TESTE 1: MarketplaceProfileService — Personalidades ────────────────────
  console.log('📌 [1/5] Testando MarketplaceProfileService (Perfis & Personalidades)...');
  const shopeeProfile = MarketplaceProfileService.getProfile('shopee');
  const amazonProfile = MarketplaceProfileService.getProfile('amazon');
  const mlProfile = MarketplaceProfileService.getProfile('mercadolivre');
  const tiktokProfile = MarketplaceProfileService.getProfile('tiktokshop');

  assert(shopeeProfile.perfil === 'promocao', 'Shopee → perfil: "promocao"');
  assert(shopeeProfile.personalidade === 'popular', 'Shopee → personalidade: "popular"');
  assert(shopeeProfile.gatilhosFortes.includes('achadinho'), 'Shopee → gatilhoForte: "achadinho"');
  assert(shopeeProfile.gatilhosFracos.includes('luxo'), 'Shopee → gatilhoFraco: "luxo"');

  assert(amazonProfile.perfil === 'premium', 'Amazon → perfil: "premium"');
  assert(amazonProfile.personalidade === 'sofisticada', 'Amazon → personalidade: "sofisticada"');
  assert(amazonProfile.gatilhosFortes.includes('autoridade'), 'Amazon → gatilhoForte: "autoridade"');

  assert(mlProfile.perfil === 'custo_beneficio', 'Mercado Livre → perfil: "custo_beneficio"');
  assert(tiktokProfile.personalidade === 'viral', 'TikTok Shop → personalidade: "viral"');
  console.log('');

  // ─── TESTE 2: MarketplaceIntelligenceScore — 7 Dimensões ─────────────────
  console.log('📌 [2/5] Testando MarketplaceIntelligenceScore (7 Dimensões)...');
  const shopeeScore = MarketplaceIntelligenceScore.getByMarketplace('shopee');
  const amazonScore = MarketplaceIntelligenceScore.getByMarketplace('amazon');

  assert(shopeeScore.priceSensitivity >= 90, `Shopee priceSensitivity: ${shopeeScore.priceSensitivity} (esperado ≥ 90)`);
  assert(shopeeScore.socialProofScore >= 85, `Shopee socialProofScore: ${shopeeScore.socialProofScore} (esperado ≥ 85)`);
  assert(shopeeScore.affiliateConversionScore >= 85, `Shopee affiliateConversionScore: ${shopeeScore.affiliateConversionScore}`);

  assert(amazonScore.trustScore >= 95, `Amazon trustScore: ${amazonScore.trustScore} (esperado ≥ 95)`);
  assert(amazonScore.deliveryScore >= 95, `Amazon deliveryScore: ${amazonScore.deliveryScore} (esperado ≥ 95)`);
  assert(amazonScore.premiumScore >= 90, `Amazon premiumScore: ${amazonScore.premiumScore} (esperado ≥ 90)`);
  console.log('');

  // ─── TESTE 3: MarketplaceMentionPolicy — NEVER / ALWAYS / AUTO ────────────
  console.log('📌 [3/5] Testando MarketplaceMentionPolicy (AUTO/ALWAYS/NEVER)...');

  const neverDecision = MarketplaceMentionPolicy.evaluate({ marketplaceSlug: 'amazon', style: 'premium', mode: 'NEVER' });
  assert(neverDecision.mode === 'NEVER', 'Modo NEVER: mode retornado corretamente');
  assert(!neverDecision.allowed, 'Modo NEVER: allowed = false');
  assert(neverDecision.formattedMentionDirective.includes('PROIBIDO'), 'Modo NEVER: diretiva contém "PROIBIDO"');

  const alwaysDecision = MarketplaceMentionPolicy.evaluate({ marketplaceSlug: 'shopee', style: 'promocao', mode: 'ALWAYS' });
  assert(alwaysDecision.mode === 'ALWAYS', 'Modo ALWAYS: mode retornado corretamente');
  assert(alwaysDecision.allowed, 'Modo ALWAYS: allowed = true');
  assert(alwaysDecision.formattedMentionDirective.includes('OBRIGATÓRIO'), 'Modo ALWAYS: diretiva contém "OBRIGATÓRIO"');

  const autoAmazonPremium = MarketplaceMentionPolicy.evaluate({ marketplaceSlug: 'amazon', style: 'premium', mode: 'AUTO' });
  assert(autoAmazonPremium.mode === 'AUTO', 'Modo AUTO (Amazon Premium): mode retornado');
  assert(!autoAmazonPremium.allowed, 'Modo AUTO (Amazon Premium): mencão omitida para preservar sofisticação');

  const autoShopeePromo = MarketplaceMentionPolicy.evaluate({ marketplaceSlug: 'shopee', style: 'promocao', mode: 'AUTO' });
  assert(autoShopeePromo.allowed, 'Modo AUTO (Shopee Promo): menção permitida como prova social');
  console.log('');

  // ─── TESTE 4: AffiliateTrustContextService — purchaseConfidenceScore ──────
  console.log('📌 [4/5] Testando AffiliateTrustContextService (purchaseConfidenceScore)...');

  const produtoConfiavel: ProductExtractionResult = {
    productId: 'tst_01', title: 'Produto Oficial Alta Avaliação', description: '',
    currentPrice: 299, originalPrice: 399, discountPercentage: 25, currency: 'BRL',
    marketplace: 'amazon', category: 'Tecnologia', subcategory: 'Gadgets', brand: 'TechBrand',
    sellerName: 'Loja Oficial Amazon', sellerRating: 4.9,
    shippingType: 'Prime', shippingPrice: 0, freeShipping: true,
    prime: true, full: false, mall: true, coupon: '', cashback: '', installments: '',
    rating: 4.9, reviewCount: 1000, soldQuantity: '5000+',
    image: '', gallery: [], canonicalUrl: '', originalUrl: '',
  };

  const trustAlto = AffiliateTrustContextService.buildTrustDirectives(produtoConfiavel);
  assert(trustAlto.purchaseConfidenceScore >= 90, `purchaseConfidenceScore alto: ${trustAlto.purchaseConfidenceScore} (esperado ≥ 90)`);
  assert(trustAlto.trustPhraseAllowed, 'trustPhraseAllowed = true para vendedor oficial + rating 4.9 + Prime');
  assert(trustAlto.trustDirectives.some(d => d.includes('ALTA SEGURANÇA')), 'Diretiva "ALTA SEGURANÇA" presente no score alto');

  const produtoSemReputacao: ProductExtractionResult = {
    ...produtoConfiavel,
    sellerName: 'Vendedor Desconhecido',
    mall: false, prime: false, full: false,
    rating: 3.2, reviewCount: 10,
  };
  const trustBaixo = AffiliateTrustContextService.buildTrustDirectives(produtoSemReputacao);
  assert(trustBaixo.purchaseConfidenceScore < 60, `purchaseConfidenceScore baixo: ${trustBaixo.purchaseConfidenceScore} (esperado < 60)`);
  assert(!trustBaixo.trustPhraseAllowed, 'trustPhraseAllowed = false para vendedor sem reputação');
  assert(trustBaixo.trustDirectives.some(d => d.includes('PROTEÇÃO ANTI-CLAIM')), 'Diretiva "PROTEÇÃO ANTI-CLAIM" presente no score baixo');
  console.log('');

  // ─── TESTE 5: AIContextBuilder.buildEnrichedBrainPayload ─────────────────
  console.log('📌 [5/5] Testando AIContextBuilder.buildEnrichedBrainPayload (Gemini Brain Payload)...');
  const builder = new AIContextBuilder();
  const brainPayload = await builder.buildEnrichedBrainPayload({
    product: produtoConfiavel,
    style: 'premium',
    mentionMode: 'AUTO',
  });

  assert(brainPayload.includes('GeminiBrain-Phase2.5'), 'Payload contém metadata da Fase 2.5');
  assert(brainPayload.includes('PRODUTO'), 'Payload contém bloco PRODUTO');
  assert(brainPayload.includes('MARKETPLACE'), 'Payload contém bloco MARKETPLACE');
  assert(brainPayload.includes('Trust Score'), 'Payload contém Trust Score dos 7 scores');
  assert(brainPayload.includes('Delivery Score'), 'Payload contém Delivery Score dos 7 scores');
  assert(brainPayload.includes('AFILIADO'), 'Payload contém bloco AFILIADO');
  assert(brainPayload.includes('Purchase Confidence Score'), 'Payload contém purchaseConfidenceScore');
  assert(brainPayload.includes('PLANO ESTRATÉGICO'), 'Payload contém bloco da CopyStrategyEngine');
  assert(brainPayload.includes('Gatilhos Fortes'), 'Payload contém gatilhos fortes do perfil');
  assert(brainPayload.includes('Gatilhos Fracos'), 'Payload contém gatilhos fracos do perfil (evitar)');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════════');
  if (failed === 0) {
    console.log(`🎉 FASE 2.5 — TODOS OS TESTES PASSARAM! (${passed}/${passed + failed})`);
  } else {
    console.log(`⚠️  RESULTADO: ${passed} passaram, ${failed} falharam.`);
  }
  console.log('═══════════════════════════════════════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('❌ ERRO INESPERADO NO SCRIPT:', err?.message || err);
  process.exit(1);
});
