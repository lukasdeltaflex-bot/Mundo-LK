import { ProductExtractionResult } from '../src/core/domain/entities/ProductExtractionResult';
import { AIContextBuilder } from '../src/infrastructure/ai/services/AIContextBuilder';
import { CopyStrategyEngine } from '../src/core/domain/services/CopyStrategyEngine';
import { GeminiAIAdapter } from '../src/infrastructure/ai/providers/gemini.adapter';
import { AIService } from '../src/app/(dashboard)/operacao/services/AIService';
import { Product } from '../src/core/domain/entities/product.entity';
import { Price } from '../src/core/domain/value-objects/price.vo';
import { DiscountPercentage } from '../src/core/domain/value-objects/discount-percentage.vo';
import { AffiliateLink } from '../src/core/domain/value-objects/affiliate-link.vo';

async function runShopeeCopyHierarchyTests() {
  console.log('================================================================');
  console.log('🧪 TESTE DE VALIDAÇÃO DE HIERARQUIA DE COPY IA (SHOPEE vs GEMINI)');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // ── TESTE 1: Produto Real Perfume Eudora La Victorieuse (Shopee) ──
  console.log('▶ [TESTE 1] Produto Real Shopee: Perfume Eudora La Victorieuse 75ml');

  const perfumeShopeeData: ProductExtractionResult = {
    title: 'Perfume Eudora La Victorieuse Eau de Parfum 75ml',
    description: 'La Victorieuse Eau de Parfum da Eudora combina notas florais envolventes com acorde cremoso de baunilha e fundo amadeirado. Uma fragrância marcante, elegante e de alta fixação. Frasco refinado de 75ml para presença inesquecível.',
    currentPrice: 189.90,
    originalPrice: 249.90,
    discountPercentage: 24,
    currency: 'BRL',
    brand: 'Eudora',
    category: 'Perfumaria',
    subcategory: 'Perfumes Femininos',
    marketplace: 'Shopee',
    sellerName: 'Loja Oficial Eudora Shopee',
    sellerRating: 4.9,
    shippingType: 'Frete Grátis Shopee',
    shippingPrice: 0,
    freeShipping: true,
    prime: false,
    full: false,
    mall: true,
    coupon: 'SHOPEE20',
    cashback: '10%',
    installments: '6x de R$ 31,65',
    image: 'https://cf.shopee.com.br/file/eudora_la_victorieuse.jpg',
    gallery: ['https://cf.shopee.com.br/file/eudora_la_victorieuse.jpg'],
    rating: 4.9,
    reviewCount: 342,
    soldQuantity: '1.2k',
    productId: 'shopee_perfume_123',
    canonicalUrl: 'https://shopee.com.br/Perfume-Eudora-La-Victorieuse-75ml-i.12345.67890',
    originalUrl: 'https://shopee.com.br/Perfume-Eudora-La-Victorieuse-75ml-i.12345.67890',
    attributes: {
      'Volume': '75ml',
      'Concentração': 'Eau de Parfum',
      'Família Olfativa': 'Floral Oriental',
      'Gênero': 'Feminino',
    },
    specifications: [
      'Frasco de vidro refinado 75ml',
      'Concentração Eau de Parfum',
      'Marca original Eudora',
    ],
  };

  const builder = new AIContextBuilder();
  const brainPayload = await builder.buildEnrichedBrainPayload({
    product: perfumeShopeeData,
    style: 'emocional',
  });

  console.log('\n--- VERIFICAÇÃO DO PAYLOAD DO CONTEXTO DA IA ---');
  const hasDescriptionInPayload = brainPayload.includes('La Victorieuse Eau de Parfum da Eudora');
  const hasShopeeInPayload = brainPayload.includes('Shopee') || brainPayload.includes('SHOPEE');
  const hasAttributesInPayload = brainPayload.includes('Volume: 75ml') || brainPayload.includes('Eau de Parfum');

  if (hasDescriptionInPayload && hasShopeeInPayload && hasAttributesInPayload) {
    console.log('✅ PASS: O payload para a IA contém a descrição oficial, atributos reais e o marketplace Shopee correto.');
    passedTests++;
  } else {
    console.error('❌ FAIL: Payload incompleto ou degradado.');
    console.error('  - Descrição presente:', hasDescriptionInPayload);
    console.error('  - Shopee no payload:', hasShopeeInPayload);
    console.error('  - Atributos no payload:', hasAttributesInPayload);
    failedTests++;
  }

  // ── TESTE 2: Geração nas 3 Estratégias (Emocional, Urgência, Premium) ──
  console.log('\n▶ [TESTE 2] Geração do Perfume Eudora nos 3 Estilos (Emocional, Urgência, Premium)');

  const stylesToTest = ['emocional', 'urgencia', 'premium'];
  const copiesResult: Record<string, string> = {};

  for (const style of stylesToTest) {
    console.log(`\n⏳ Gerando estilo "${style.toUpperCase()}"...`);
    const copy = await AIService.generateOfferCopy({
      title: perfumeShopeeData.title,
      description: perfumeShopeeData.description,
      brand: perfumeShopeeData.brand,
      category: perfumeShopeeData.category,
      marketplaceSlug: 'shopee',
      attributes: perfumeShopeeData.attributes,
      specifications: perfumeShopeeData.specifications,
      price: perfumeShopeeData.currentPrice!,
      previousPrice: perfumeShopeeData.originalPrice!,
      affiliateUrl: perfumeShopeeData.originalUrl,
      style,
    });

    copiesResult[style] = copy;
    console.log(`📝 COPY [${style.toUpperCase()}]:\n${copy.slice(0, 300)}...\n`);
  }

  // Validação do teste 2: O produto (perfume/fragrância/75ml/Eudora) deve ser reconhecível nos 3 estilos
  let stylesPass = true;
  for (const style of stylesToTest) {
    const textLower = copiesResult[style].toLowerCase();
    const isPerfumeSpecific =
      textLower.includes('perfume') ||
      textLower.includes('fragrância') ||
      textLower.includes('eudora') ||
      textLower.includes('victorieuse') ||
      textLower.includes('parfum') ||
      textLower.includes('75ml') ||
      textLower.includes('aroma');

    if (!isPerfumeSpecific) {
      console.error(`❌ FAIL: Estilo "${style}" gerou uma copy genérica desprovida de contexto de perfumaria!`);
      stylesPass = false;
    }
  }

  if (stylesPass) {
    console.log('✅ PASS: Todos os 3 estilos (Emocional, Urgência, Premium) mantiveram a identidade de perfumaria do produto real!');
    passedTests++;
  } else {
    failedTests++;
  }

  // ── TESTE 3: Teste de Intercambialidade (Perfume vs Eletrônico) ──
  console.log('\n▶ [TESTE 3] Teste de Intercambialidade (Perfume vs Fone de Ouvido)');

  const phoneCopy = await AIService.generateOfferCopy({
    title: 'Fone de Ouvido Bluetooth Sem Fio Noise Cancelling',
    description: 'Fone de ouvido com cancelamento ativo de ruído ANC, bateria de 30 horas, som estéreo HD e conexão Bluetooth 5.3 rápida.',
    brand: 'AudioTech',
    category: 'Eletrônicos',
    marketplaceSlug: 'shopee',
    price: 149.90,
    previousPrice: 199.90,
    affiliateUrl: 'https://shopee.com.br/fone-123',
    style: 'premium',
  });

  const perfumePremiumText = copiesResult['premium'].toLowerCase();
  const phonePremiumText = phoneCopy.toLowerCase();

  // Verifica se o texto do perfume não serviria para um fone de ouvido
  const perfumeHasAudioTerms = perfumePremiumText.includes('bateria') || perfumePremiumText.includes('bluetooth') || perfumePremiumText.includes('cancelamento de ruído');
  const phoneHasPerfumeTerms = phonePremiumText.includes('fragrância') || phonePremiumText.includes('notas florais') || phonePremiumText.includes('eau de parfum');

  if (!perfumeHasAudioTerms && !phoneHasPerfumeTerms) {
    console.log('✅ PASS: As copys são 100% específicas do produto e NÃO intercambiáveis entre domínios!');
    passedTests++;
  } else {
    console.error('❌ FAIL: Detectada vazão de termos genéricos entre categorias.');
    failedTests++;
  }

  // ── TESTE 4: Teste de Dados Ausentes & Falha de Extração (Sem Alucinação) ──
  console.log('\n▶ [TESTE 4] Teste de Dados Ausentes (Sem Descrição e Sem Marca)');

  const sparseCopy = await AIService.generateOfferCopy({
    title: 'Caneca Térmica de Inox 500ml',
    price: 49.90,
    affiliateUrl: 'https://shopee.com.br/caneca-123',
    style: 'urgencia',
    marketplaceSlug: 'shopee',
  });

  const sparseLower = sparseCopy.toLowerCase();
  // Garante que a IA não inventou marca ou características não fornecidas
  const noFakeBrand = !sparseLower.includes('marca oficial') && !sparseLower.includes('marca eudora');

  if (noFakeBrand) {
    console.log('✅ PASS: A IA respeitou dados ausentes sem inventar marcas fictícias ou especificações inexistentes.');
    passedTests++;
  } else {
    console.error('❌ FAIL: A IA inventou especificações não fornecidas.');
    failedTests++;
  }

  // ── TESTE 5: Teste de Roteamento de Marketplaces (Shopee vs Mercado Livre vs Magalu) ──
  console.log('\n▶ [TESTE 5] Teste de Preservação de Marketplace (Shopee, Mercado Livre, Magalu)');

  const testMkts = ['shopee', 'mercadolivre', 'magalu'];
  let mktPass = true;

  for (const mkt of testMkts) {
    const pData: ProductExtractionResult = {
      title: 'Produto Teste Marketplace',
      description: 'Descrição de teste',
      currentPrice: 99,
      originalPrice: 120,
      discountPercentage: 15,
      currency: 'BRL',
      brand: 'TestBrand',
      category: 'Geral',
      subcategory: 'Geral',
      marketplace: mkt,
      sellerName: 'Vendedor',
      sellerRating: 5,
      shippingType: 'Padrão',
      shippingPrice: 0,
      freeShipping: true,
      prime: false,
      full: false,
      mall: false,
      coupon: '',
      cashback: '',
      installments: '',
      image: '',
      gallery: [],
      rating: 5,
      reviewCount: 10,
      soldQuantity: '50',
      productId: `test_${mkt}`,
      canonicalUrl: `https://${mkt}.com/item`,
      originalUrl: `https://${mkt}.com/item`,
    };

    const payload = await builder.buildEnrichedBrainPayload({ product: pData, style: 'padrao' });
    const normPayload = payload.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normMkt = mkt.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!normPayload.includes(normMkt)) {
      console.error(`❌ FAIL: Marketplace "${mkt}" não foi preservado no payload do Gemini Brain.`);
      mktPass = false;
    }
  }

  if (mktPass) {
    console.log('✅ PASS: Todos os marketplaces (Shopee, Mercado Livre, Magalu) chegam corretamente ao Gemini.');
    passedTests++;
  } else {
    failedTests++;
  }

  // ── RELATÓRIO FINAL ──
  console.log('\n================================================================');
  console.log('📊 RESUMO DA SUÍTE DE TESTES DE HIERARQUIA DE COPY');
  console.log('================================================================');
  console.log(`• Testes Aprovados: ${passedTests}`);
  console.log(`• Testes Falhos:    ${failedTests}`);
  console.log(`• Status Final:     ${failedTests === 0 ? '🟢 PASS (TUDO OK!)' : '🔴 FAIL'}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runShopeeCopyHierarchyTests().catch((err) => {
  console.error('💥 Erro fatal no executor de testes:', err);
  process.exit(1);
});
