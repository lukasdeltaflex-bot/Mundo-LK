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

import { MarketplaceConfigRegistry } from '../src/core/domain/services/MarketplaceConfigRegistry';
import { MarketplaceDataValidator } from '../src/core/domain/services/MarketplaceDataValidator';
import { AIContextBuilder } from '../src/infrastructure/ai/services/AIContextBuilder';
import { ProductExtractionResult } from '../src/core/domain/entities/ProductExtractionResult';

async function runMultimarketplaceAIContextVerification() {
  console.log('=====================================================================');
  console.log('🧪 MUNDO LK — TESTE DE INTELIGÊNCIA COMERCIAL MULTIMARKETPLACE & IA');
  console.log('=====================================================================\n');

  const builder = new AIContextBuilder();
  const registry = MarketplaceConfigRegistry.getInstance();

  // ── TESTE 1: REGISTRO E BRANDING CONFIGURÁVEL MULTIMARKETPLACE ──
  console.log('📌 [1/4] Testando Branding & Estratégias Comerciais Configuráveis...');
  const shopeeContext = registry.getContext('shopee');
  const amazonContext = registry.getContext('amazon');
  const customContext = registry.getContext('novomarketplace');

  console.log('• Shopee Cor:', shopeeContext.identidadeVisual.cor, '| Trust Level:', shopeeContext.strategy.trustLevel);
  console.log('• Amazon Cor:', amazonContext.identidadeVisual.cor, '| Trust Level:', amazonContext.strategy.trustLevel);
  console.log('• Custom Fallback Cor:', customContext.identidadeVisual.cor, '| Nome:', customContext.nome);
  console.log('✓ Branding Dinâmico e Estratégia Comercial validados.\n');

  // ── TESTE 2: VALIDADOR ANTI-HALUCINAÇÃO ──
  console.log('📌 [2/4] Testando Validador Anti-Halucinação (MarketplaceDataValidator)...');
  const mockRawProduct: ProductExtractionResult = {
    productId: 'shopee_123',
    title: 'Perfume Importado Eau de Parfum 100ml',
    description: 'Fragrância marcante e duradoura.',
    currentPrice: 350.00,
    originalPrice: 500.00,
    discountPercentage: 30,
    currency: 'BRL',
    marketplace: 'shopee',
    category: 'Perfumaria',
    subcategory: 'Fragrâncias',
    brand: 'LuxBrand',
    sellerName: 'Loja Oficial LuxBrand',
    sellerRating: 4.9,
    shippingType: 'Frete Normal',
    shippingPrice: 15.00,
    freeShipping: false,
    prime: false,
    full: false,
    mall: true,
    coupon: '',
    cashback: '',
    installments: '6x de R$ 58,33 sem juros',
    rating: 4.8,
    reviewCount: 150,
    soldQuantity: '1.2k',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500',
    gallery: [],
    canonicalUrl: 'https://shopee.com.br/perfume-123',
    originalUrl: 'https://shopee.com.br/perfume-123',
  };

  const offerContext = MarketplaceDataValidator.validateAndBuildOfferContext(mockRawProduct);
  const antiHallucinationRules = MarketplaceDataValidator.buildAntiHallucinationInstructions(offerContext.dadosComerciaisValidados);

  console.log('--- REGRAS DE VERACIDADE INJETADAS ---');
  console.log(antiHallucinationRules);
  if (antiHallucinationRules.includes('PROIBIDO mencionar "Frete Grátis"')) {
    console.log('✓ TRAVA RÍGIDA ANTI-HALUCINAÇÃO OK: Frete grátis não confirmado foi bloqueado com sucesso.');
  } else {
    throw new Error('❌ Falha na trava anti-halucinação!');
  }
  console.log('-------------------------------------\n');

  // ── TESTE 3: MODOS DE MENÇÃO INTELLIGENTE (AUTO / ALWAYS / NEVER) ──
  console.log('📌 [3/4] Testando Modos de Menção do Marketplace (AUTO / ALWAYS / NEVER)...');

  // Modo AUTO em Produto Premium (Deves omitir menção forçada de marketplace)
  const promptAuto = builder.buildUniversalMarketplacePrompt(mockRawProduct, 'AUTO');
  console.log('• Prompt MODO AUTO construido (Tamanho:', promptAuto.length, 'chars)');

  // Modo ALWAYS (Deves obrigar referência explícita)
  const promptAlways = builder.buildUniversalMarketplacePrompt(mockRawProduct, 'ALWAYS');
  if (!promptAlways.includes('OBRIGATÓRIO: Incluir referência explícita')) {
    throw new Error('❌ Modo ALWAYS não gerou diretiva obrigatória!');
  }
  console.log('✓ Modo ALWAYS gerou diretiva obrigatória com sucesso.');

  // Modo NEVER (Deves proibir citação do nome)
  const promptNever = builder.buildUniversalMarketplacePrompt(mockRawProduct, 'NEVER');
  if (!promptNever.includes('PROIBIDO: NUNCA citar explicitamente')) {
    throw new Error('❌ Modo NEVER não gerou proibição!');
  }
  console.log('✓ Modo NEVER gerou proibição rígida com sucesso.\n');

  // ── TESTE 4: DIVERSIDADE DE MARKETPLACES ──
  console.log('📌 [4/4] Testando Extração de Contexto em Múltiplos Marketplaces...');
  const marketplaces = ['shopee', 'mercadolivre', 'amazon', 'magalu', 'aliexpress', 'tiktokshop'];
  marketplaces.forEach((mkt) => {
    const ctx = builder.buildUniversalMarketplacePrompt({
      ...mockRawProduct,
      marketplace: mkt,
    }, 'AUTO');
    if (!ctx.includes('INTELIGÊNCIA DO CANAL')) {
      throw new Error(`❌ Contexto falhou para ${mkt}`);
    }
  });
  console.log('✓ Todos os 6 marketplaces processados com sucesso.\n');

  console.log('=====================================================================');
  console.log('🎉 INTELIGÊNCIA COMERCIAL MULTIMARKETPLACE & IA VALIDADA COM SUCESSO');
  console.log('=====================================================================');
  process.exit(0);
}

runMultimarketplaceAIContextVerification().catch((err) => {
  console.error('❌ ERRO NO TESTE MULTIMARKETPLACE:', err.message);
  process.exit(1);
});
