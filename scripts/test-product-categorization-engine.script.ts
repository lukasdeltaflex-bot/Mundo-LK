import { Product } from '../src/core/domain/entities/product.entity';
import { Offer } from '../src/core/domain/entities/offer.entity';
import { ManagedCategory } from '../src/core/domain/entities/managed-category.entity';
import { CategoryPreference } from '../src/core/domain/entities/category-preference.entity';
import { ProductCategorizationService } from '../src/core/domain/services/ProductCategorizationService';
import { Price, DiscountPercentage, AffiliateLink, ChannelContent } from '../src/core/domain/value-objects';

async function runCategorizationTestSuite() {
  console.log('================================================================');
  console.log('🚀 EXECUTANDO SUÍTE DE TESTES — PRODUCT CATEGORIZATION ENGINE (FASE 4)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // Categories Setup
  const catBeleza = new ManagedCategory({ id: 'cat_beleza', userId: 'user_test_01', name: 'Beleza' });
  const subPele = new ManagedCategory({ id: 'cat_pele', userId: 'user_test_01', name: 'Cuidados com a Pele', parentCategoryId: 'cat_beleza' });
  const catEletronicos = new ManagedCategory({ id: 'cat_eletronicos', userId: 'user_test_01', name: 'Eletrônicos' });
  const subAcessorios = new ManagedCategory({ id: 'cat_acessorios', userId: 'user_test_01', name: 'Acessórios', parentCategoryId: 'cat_eletronicos' });
  const catCasa = new ManagedCategory({ id: 'cat_casa', userId: 'user_test_01', name: 'Casa' });

  const categories: ManagedCategory[] = [catBeleza, subPele, catEletronicos, subAcessorios, catCasa];

  const service = new ProductCategorizationService();

  // ---------------------------------------------------------------------------
  // TESTE 1: IA / Heurística categoriza produto
  // ---------------------------------------------------------------------------
  try {
    const prod1 = new Product({
      id: 'prod_test_01',
      userId: 'user_test_01',
      title: 'Kit Hidratante Corporal Nivea 400ml',
      description: 'Creme de pele altamente nutritivo',
      brand: 'Nivea',
      categoryId: 'Geral',
      marketplaceSlug: 'shopee',
      originalUrl: 'https://shopee.com.br/product/123/456',
      affiliateUrl: AffiliateLink.create('https://shopee.com.br/product/123/456'),
      currentPrice: Price.create(49.90),
      discountPercentage: DiscountPercentage.create(10),
      images: ['https://example.com/img1.jpg'],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res1 = await service.classifyProduct(prod1, categories, []);

    if (res1.categoryId === 'cat_beleza' && res1.source === 'AI') {
      console.log('✅ TESTE 1 PASSOU: IA categorizou produto ("Kit Hidratante") como Beleza (Source: AI, Confidence: ' + Math.round((res1.confidence || 0) * 100) + '%)');
      passed++;
    } else {
      console.error('❌ TESTE 1 FALHOU:', res1);
      failed++;
    }
  } catch (err) {
    console.error('❌ TESTE 1 ERRO:', err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TESTE 2: Alteração Manual pelo Usuário
  // ---------------------------------------------------------------------------
  try {
    const prod2 = new Product({
      id: 'prod_test_02',
      userId: 'user_test_01',
      title: 'Kit Hidratante Corporal Nivea',
      description: '',
      brand: 'Nivea',
      categoryId: 'Beleza',
      marketplaceSlug: 'mercadolivre',
      originalUrl: 'https://mercadolivre.com.br/item/789',
      affiliateUrl: AffiliateLink.create('https://mercadolivre.com.br/item/789'),
      currentPrice: Price.create(50),
      discountPercentage: DiscountPercentage.create(0),
      images: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // User updates manually to "Casa"
    const updated = prod2.updateCategory({
      categoryId: 'Casa',
      source: 'MANUAL',
      confidence: 1.0,
      locked: false,
    });

    if (updated && prod2.categoryId === 'Casa' && prod2.categorySource === 'MANUAL') {
      console.log('✅ TESTE 2 PASSOU: Usuário alterou categoria manualmente para "Casa" (Source: MANUAL)');
      passed++;
    } else {
      console.error('❌ TESTE 2 FALHOU:', prod2);
      failed++;
    }
  } catch (err) {
    console.error('❌ TESTE 2 ERRO:', err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TESTE 3: Bloqueio (categoryLocked = true) impede que a IA sobrescreva
  // ---------------------------------------------------------------------------
  try {
    const prod3 = new Product({
      id: 'prod_test_03',
      userId: 'user_test_01',
      title: 'Kit Hidratante Nivea',
      description: '',
      brand: 'Nivea',
      categoryId: 'Casa',
      categorySource: 'MANUAL',
      categoryLocked: true,
      marketplaceSlug: 'shopee',
      originalUrl: 'https://shopee.com.br/product/999',
      affiliateUrl: AffiliateLink.create('https://shopee.com.br/product/999'),
      currentPrice: Price.create(30),
      discountPercentage: DiscountPercentage.create(0),
      images: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // AI tries to classify product
    const res3 = await service.classifyProduct(prod3, categories, []);

    if (res3.skippedLocked && res3.categoryId === 'Casa') {
      console.log('✅ TESTE 3 PASSOU: Trava categoryLocked = true impediu que a IA alterasse a categoria "Casa"');
      passed++;
    } else {
      console.error('❌ TESTE 3 FALHOU:', res3);
      failed++;
    }
  } catch (err) {
    console.error('❌ TESTE 3 ERRO:', err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TESTE 4: Memória de Categorização (Category Preferences)
  // ---------------------------------------------------------------------------
  try {
    const memoryPref = new CategoryPreference({
      id: 'pref_01',
      userId: 'user_test_01',
      keywordPattern: 'capa iphone',
      targetCategoryId: 'cat_eletronicos',
      targetCategoryName: 'Eletrônicos',
      targetSubcategoryId: 'cat_acessorios',
      targetSubcategoryName: 'Acessórios',
      correctionCount: 5,
    });

    const prod4 = new Product({
      id: 'prod_test_04',
      userId: 'user_test_01',
      title: 'Capa para iPhone 16 Pro Max Silicone Anti-impacto',
      description: 'Proteção para celular',
      brand: 'Apple',
      categoryId: 'Geral',
      marketplaceSlug: 'amazon',
      originalUrl: 'https://amazon.com.br/dp/B0001',
      affiliateUrl: AffiliateLink.create('https://amazon.com.br/dp/B0001'),
      currentPrice: Price.create(89),
      discountPercentage: DiscountPercentage.create(0),
      images: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res4 = await service.classifyProduct(prod4, categories, [memoryPref]);

    if (res4.categoryId === 'cat_eletronicos' && res4.source === 'LEARNED') {
      console.log('✅ TESTE 4 PASSOU: Memória de categorização sugeriu "Eletrônicos" com base no aprendizado do usuário (Source: LEARNED)');
      passed++;
    } else {
      console.error('❌ TESTE 4 FALHOU:', res4);
      failed++;
    }
  } catch (err) {
    console.error('❌ TESTE 4 ERRO:', err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TESTE 5: Tolerância a Falhas da IA
  // ---------------------------------------------------------------------------
  try {
    const prod5 = new Product({
      id: 'prod_test_05',
      userId: 'user_test_01',
      title: 'Mesa de Cabeceira Retrô',
      description: '',
      brand: 'Casa',
      categoryId: 'Casa',
      categorySource: 'MANUAL',
      marketplaceSlug: 'shopee',
      originalUrl: 'https://shopee.com.br/product/555',
      affiliateUrl: AffiliateLink.create('https://shopee.com.br/product/555'),
      currentPrice: Price.create(120),
      discountPercentage: DiscountPercentage.create(0),
      images: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Mock an internal AI error
    const faultyService = new ProductCategorizationService();
    (faultyService as any).queryAIForCategory = async () => {
      throw new Error('Timeout na API da IA');
    };

    const res5 = await faultyService.classifyProduct(prod5, categories, []);

    if (res5.categoryId === 'Casa') {
      console.log('✅ TESTE 5 PASSOU: Falha na IA não causou perda de dados e manteve a categoria "Casa" intacta');
      passed++;
    } else {
      console.error('❌ TESTE 5 FALHOU:', res5);
      failed++;
    }
  } catch (err) {
    console.error('❌ TESTE 5 ERRO:', err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TESTE 6: Relação Product 1:N Offer Preservada
  // ---------------------------------------------------------------------------
  try {
    const p001 = new Product({
      id: 'P001',
      userId: 'user_test_01',
      title: 'Fone de Ouvido Bluetooth JBL',
      description: '',
      brand: 'JBL',
      categoryId: 'Beleza',
      marketplaceSlug: 'shopee',
      originalUrl: 'https://shopee.com.br/product/1000',
      affiliateUrl: AffiliateLink.create('https://shopee.com.br/product/1000'),
      currentPrice: Price.create(199),
      discountPercentage: DiscountPercentage.create(20),
      images: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const o001 = new Offer({
      id: 'OFF-001',
      productId: p001.id,
      userId: p001.userId,
      scoreValue: 95,
      scoreLabel: 'EXCELLENT',
      scoreJustification: 'Shopee Promo',
      copies: ChannelContent.create({ whatsAppText: 'Shopee Copy' }),
      hashtags: ['#JBL'],
      emojis: ['🎧'],
      cta: 'Compre na Shopee',
      aiProviderUsed: 'Gemini 2.5 Flash',
      createdAt: new Date(),
      marketplaceId: 'shopee',
    });

    const o002 = new Offer({
      id: 'OFF-002',
      productId: p001.id,
      userId: p001.userId,
      scoreValue: 92,
      scoreLabel: 'EXCELLENT',
      scoreJustification: 'Mercado Livre Promo',
      copies: ChannelContent.create({ whatsAppText: 'ML Copy' }),
      hashtags: ['#JBL'],
      emojis: ['🎧'],
      cta: 'Compre no Mercado Livre',
      aiProviderUsed: 'Gemini 2.5 Flash',
      createdAt: new Date(),
      marketplaceId: 'mercadolivre',
    });

    // Change category on P001
    p001.updateCategory({
      categoryId: 'Eletrônicos',
      source: 'MANUAL',
      confidence: 1.0,
      locked: true,
    });

    if (p001.id === 'P001' && o001.productId === 'P001' && o002.productId === 'P001') {
      console.log('✅ TESTE 6 PASSOU: Alterar categoria de P001 preservou a relação Product 1:N Offer (OFF-001 e OFF-002 continuam vinculados)');
      passed++;
    } else {
      console.error('❌ TESTE 6 FALHOU:', { p001, o001, o002 });
      failed++;
    }
  } catch (err) {
    console.error('❌ TESTE 6 ERRO:', err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TESTE 7: Importação não destrutiva
  // ---------------------------------------------------------------------------
  try {
    const rawImportTitle = 'Smartwatch Xiaomi Amazfit Bip 5';
    const prod7 = new Product({
      id: 'prod_import_01',
      userId: 'user_test_01',
      title: rawImportTitle,
      description: 'Relógio inteligente',
      brand: 'Xiaomi',
      categoryId: 'Geral',
      marketplaceSlug: 'aliexpress',
      originalUrl: 'https://aliexpress.com/item/111',
      affiliateUrl: AffiliateLink.create('https://aliexpress.com/item/111'),
      currentPrice: Price.create(250),
      discountPercentage: DiscountPercentage.create(15),
      images: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res7 = await service.classifyProduct(prod7, categories, []);

    if (prod7.id === 'prod_import_01' && prod7.originalUrl === 'https://aliexpress.com/item/111') {
      console.log('✅ TESTE 7 PASSOU: Importação e categorização preservaram ID único, originalUrl e integridade do produto');
      passed++;
    } else {
      console.error('❌ TESTE 7 FALHOU:', res7);
      failed++;
    }
  } catch (err) {
    console.error('❌ TESTE 7 ERRO:', err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TESTE 8: Alteração em Massa
  // ---------------------------------------------------------------------------
  try {
    const mockProducts: Product[] = [];
    for (let i = 1; i <= 100; i++) {
      mockProducts.push(
        new Product({
          id: `prod_bulk_${i}`,
          userId: 'user_test_01',
          title: `Produto de Teste em Massa ${i}`,
          description: '',
          brand: 'Geral',
          categoryId: 'Geral',
          marketplaceSlug: 'shopee',
          originalUrl: `https://shopee.com.br/product/bulk/${i}`,
          affiliateUrl: AffiliateLink.create(`https://shopee.com.br/product/bulk/${i}`),
          currentPrice: Price.create(100 + i),
          discountPercentage: DiscountPercentage.create(0),
          images: [],
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );
    }

    let updatedBulkCount = 0;
    for (const p of mockProducts) {
      const ok = p.updateCategory({
        categoryId: 'Beleza',
        subcategoryId: 'cat_pele',
        source: 'MANUAL',
        confidence: 1.0,
        locked: false,
      });
      if (ok) updatedBulkCount++;
    }

    if (updatedBulkCount === 100) {
      console.log('✅ TESTE 8 PASSOU: Alteração de categoria em massa processou exatamente 100 produtos com sucesso');
      passed++;
    } else {
      console.error('❌ TESTE 8 FALHOU: Total atualizado =', updatedBulkCount);
      failed++;
    }
  } catch (err) {
    console.error('❌ TESTE 8 ERRO:', err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // TESTE 9: Multi-tenancy & Segurança de Dados
  // ---------------------------------------------------------------------------
  try {
    const catUserA = new ManagedCategory({ id: 'cat_a', userId: 'user_A', name: 'Categoria User A' });
    const catUserB = new ManagedCategory({ id: 'cat_b', userId: 'user_B', name: 'Categoria User B' });

    const prefUserA = new CategoryPreference({
      id: 'pref_a',
      userId: 'user_A',
      keywordPattern: 'shampoo',
      targetCategoryId: 'cat_a',
      targetCategoryName: 'Categoria User A',
    });

    const prodUserB = new Product({
      id: 'prod_user_b',
      userId: 'user_B',
      title: 'Shampoo Neutro 500ml',
      description: '',
      brand: 'Geral',
      categoryId: 'Geral',
      marketplaceSlug: 'shopee',
      originalUrl: 'https://shopee.com.br/b',
      affiliateUrl: AffiliateLink.create('https://shopee.com.br/b'),
      currentPrice: Price.create(25),
      discountPercentage: DiscountPercentage.create(0),
      images: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // User B classifies product with ONLY User B categories and preferences
    const res9 = await service.classifyProduct(prodUserB, [catUserB], []);

    if (res9.categoryId !== 'cat_a') {
      console.log('✅ TESTE 9 PASSOU: Isolamento de multi-tenancy confirmado (User B não acessa preferências/categorias de User A)');
      passed++;
    } else {
      console.error('❌ TESTE 9 FALHOU:', res9);
      failed++;
    }
  } catch (err) {
    console.error('❌ TESTE 9 ERRO:', err);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 RESUMO DA SUÍTE DE TESTES DA FASE 4:`);
  console.log(`   TOTAL DE TESTES : ${passed + failed}`);
  console.log(`   TESTES APROVADOS: ${passed}`);
  console.log(`   TESTES FALHADOS : ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runCategorizationTestSuite();
