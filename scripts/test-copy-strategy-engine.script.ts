import fs from 'fs';
import path from 'path';

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value.trim();
      }
    });
  }
} catch (e) {}

import { MarketplaceIntelligenceScore } from '../src/core/domain/value-objects/MarketplaceIntelligenceScore';
import { CopyStrategyEngine } from '../src/core/domain/services/CopyStrategyEngine';
import { AffiliateTrustContextService } from '../src/core/domain/services/AffiliateTrustContextService';
import { ProductExtractionResult } from '../src/core/domain/entities/ProductExtractionResult';

async function runPhase2CopyStrategyEngineVerification() {
  console.log('=====================================================================');
  console.log('🧪 MUNDO LK FASE 2 — TESTE DO COPYSTRATEGYENGINE & MARKEPLACE SCORES');
  console.log('=====================================================================\n');

  // ── TESTE 1: MARKETPLACE INTELLIGENCE SCORES ──
  console.log('📌 [1/4] Testando MarketplaceIntelligenceScore (Vetor Quantitativo)...');
  const shopeeScore = MarketplaceIntelligenceScore.getByMarketplace('shopee');
  const amazonScore = MarketplaceIntelligenceScore.getByMarketplace('amazon');

  console.log('• Shopee Score -> Price Sensitivity:', shopeeScore.priceSensitivity, '| Urgency:', shopeeScore.urgencyScore, '| Premium:', shopeeScore.premiumScore);
  console.log('• Amazon Score -> Trust Score:', amazonScore.trustScore, '| Premium:', amazonScore.premiumScore, '| Price Sensitivity:', amazonScore.priceSensitivity);

  if (shopeeScore.priceSensitivity < 90 || amazonScore.trustScore < 95) {
    throw new Error('❌ Falha nos índices de MarketplaceIntelligenceScore!');
  }
  console.log('✓ MarketplaceIntelligenceScore validado com sucesso.\n');

  // ── TESTE 2: COPYSTRATEGYENGINE — PRODUTO PREMIUM NA AMAZON ──
  console.log('📌 [2/4] Testando CopyStrategyEngine em Produto Premium (Amazon)...');
  const mockPremiumProduct: ProductExtractionResult = {
    productId: 'amz_premium_123',
    title: 'Smartwatch Premium AMOLED Safira Titanium',
    description: 'Relógio inteligente de alta precisão com acabamento em safira.',
    currentPrice: 2499.00,
    originalPrice: 2999.00,
    discountPercentage: 16,
    currency: 'BRL',
    marketplace: 'amazon',
    category: 'Tecnologia & Wearables',
    subcategory: 'Smartwatches',
    brand: 'TitanTech',
    sellerName: 'Loja Oficial Amazon Prime',
    sellerRating: 4.9,
    shippingType: 'Entrega Grátis Prime',
    shippingPrice: 0,
    freeShipping: true,
    prime: true,
    full: false,
    mall: true,
    coupon: '',
    cashback: '',
    installments: '10x de R$ 249,90 sem juros',
    rating: 4.9,
    reviewCount: 320,
    soldQuantity: '500+',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    gallery: [],
    canonicalUrl: 'https://amazon.com.br/dp/B08XXXXX',
    originalUrl: 'https://amazon.com.br/dp/B08XXXXX',
  };

  const strategyPremium = await CopyStrategyEngine.buildStrategy({
    product: mockPremiumProduct,
    style: 'premium',
    mentionMode: 'AUTO',
  });

  const promptBlockPremium = CopyStrategyEngine.formatStrategyPromptBlock(strategyPremium);
  console.log('--- ESTRATÉGIA SINTETIZADA (PRODUTO PREMIUM) ---');
  console.log(promptBlockPremium);
  console.log('------------------------------------------------\n');

  if (!strategyPremium.tomDeVoz.includes('Sofisticado')) {
    throw new Error('❌ Tom de voz premium não foi aplicado corretamente!');
  }
  console.log('✓ Estratégia Premium sintetizada com sucesso.\n');

  // ── TESTE 3: COPYSTRATEGYENGINE — PRODUTO PROMOCIONAL NA SHOPEE ──
  console.log('📌 [3/4] Testando CopyStrategyEngine em Produto Promocional (Shopee)...');
  const mockPromoProduct: ProductExtractionResult = {
    ...mockPremiumProduct,
    productId: 'shp_promo_456',
    title: 'Kit 3 Camisetas Algodão Premium Pima',
    currentPrice: 59.90,
    originalPrice: 129.90,
    discountPercentage: 53,
    marketplace: 'shopee',
    category: 'Moda Masculina',
    prime: false,
    freeShipping: false,
  };

  const strategyPromo = await CopyStrategyEngine.buildStrategy({
    product: mockPromoProduct,
    style: 'promocao',
    mentionMode: 'ALWAYS',
  });

  const promptBlockPromo = CopyStrategyEngine.formatStrategyPromptBlock(strategyPromo);
  console.log('--- ESTRATÉGIA SINTETIZADA (PRODUTO PROMO) ---');
  console.log(promptBlockPromo);
  console.log('----------------------------------------------\n');

  if (!promptBlockPromo.includes('OBRIGATÓRIO: Mencione a Shopee')) {
    throw new Error('❌ Diretiva ALWAYS falhou na síntese da estratégia!');
  }
  console.log('✓ Estratégia Promocional sintetizada com sucesso.\n');

  // ── TESTE 4: CONTEXTO DE CONFIANÇA DO AFILIADO ──
  console.log('📌 [4/4] Testando AffiliateTrustContextService...');
  const trustRes = AffiliateTrustContextService.buildTrustDirectives(mockPremiumProduct);
  console.log('• Frases de Confiança Permitidas:', trustRes.trustPhraseAllowed);
  console.log('• Selo Vendedor:', trustRes.sellerBadgeText);
  if (!trustRes.trustPhraseAllowed) {
    throw new Error('❌ Produto Prime/Oficial deveria ter frases de confiança liberadas!');
  }
  console.log('✓ AffiliateTrustContextService validado com sucesso.\n');

  console.log('=====================================================================');
  console.log('🎉 FASE 2 — COPYSTRATEGYENGINE & MARKEPLACE SCORES VALIDADOS!');
  console.log('=====================================================================');
  process.exit(0);
}

runPhase2CopyStrategyEngineVerification().catch((err) => {
  console.error('❌ ERRO NO TESTE DA FASE 2:', err.message);
  process.exit(1);
});
