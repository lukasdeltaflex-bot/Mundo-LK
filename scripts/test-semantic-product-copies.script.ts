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

import { GeminiAIAdapter } from '../src/infrastructure/ai/providers/gemini.adapter';
import { Product } from '../src/core/domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '../src/core/domain/value-objects';
import { CopySimilarityValidator } from '../src/core/domain/services/CopySimilarityValidator';

async function runSemanticAudit() {
  console.log('===========================================================');
  console.log('🧪 MUNDO LK — AUDITORIA DE INTELIGÊNCIA SEMÂNTICA DE PRODUTO');
  console.log('===========================================================\n');

  const adapter = new GeminiAIAdapter();

  // Test 1: Bolsa Feminina Couro (Estilo: Premium)
  console.log('📍 1. Produto: Bolsa Feminina de Couro Legitimo (Estilo: Premium)');
  const bagProd = new Product({
    id: 'prod_bag',
    userId: 'test_user',
    title: 'Bolsa Feminina de Couro Legítimo Arezzo Classic',
    description: 'Bolsa de couro com acabamento fino, alça regulável e compartimentos internos.',
    brand: 'Arezzo',
    categoryId: 'Moda Feminina',
    marketplaceSlug: 'mercadolivre',
    originalUrl: 'https://s.shopee.com.br/bag123',
    affiliateUrl: AffiliateLink.create('https://s.shopee.com.br/bag123'),
    currentPrice: Price.create(249.90),
    previousPrice: Price.create(399.90),
    discountPercentage: DiscountPercentage.create(37),
    images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500'],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const bagResult = await adapter.generateOfferContent(bagProd, 'premium');
  console.log('  • Ângulo:', bagResult.analysis?.anguloDeVenda);
  console.log('  • Dor Solucionada:', bagResult.analysis?.dorQueResolve);
  console.log('  • Snippet WhatsApp:', bagResult.copies.copies.whatsAppText.substring(0, 120) + '...\n');

  // Test 2: Garrafa Térmica 1L (Estilo: Urgência)
  console.log('📍 2. Produto: Garrafa Térmica 1L Inox Vacuum (Estilo: Urgência)');
  const bottleProd = new Product({
    id: 'prod_bottle',
    userId: 'test_user',
    title: 'Garrafa Térmica 1L Inox Mantém Gelado por 24h',
    description: 'Garrafa com parede dupla de inox, tampa anti-vazamento ideal para academia e trabalho.',
    brand: 'ThermoPro',
    categoryId: 'Casa & Cozinha',
    marketplaceSlug: 'shopee',
    originalUrl: 'https://s.shopee.com.br/bottle456',
    affiliateUrl: AffiliateLink.create('https://s.shopee.com.br/bottle456'),
    currentPrice: Price.create(79.90),
    previousPrice: Price.create(129.90),
    discountPercentage: DiscountPercentage.create(38),
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const bottleResult = await adapter.generateOfferContent(bottleProd, 'urgencia');
  console.log('  • Ângulo:', bottleResult.analysis?.anguloDeVenda);
  console.log('  • Dor Solucionada:', bottleResult.analysis?.dorQueResolve);
  console.log('  • Snippet WhatsApp:', bottleResult.copies.copies.whatsAppText.substring(0, 120) + '...\n');

  // Test 3: Skate Profissional (Estilo: Explosiva)
  console.log('📍 3. Produto: Skate Profissional Maple Abec-9 (Estilo: Explosiva)');
  const skateProd = new Product({
    id: 'prod_skate',
    userId: 'test_user',
    title: 'Skate Completo Profissional Shape Maple Rolamento Abec-9',
    description: 'Skate profissional montado com truck de alumínio, lixa emborrachada e alta resistência.',
    brand: 'Element',
    categoryId: 'Esporte & Lazer',
    marketplaceSlug: 'mercadolivre',
    originalUrl: 'https://s.shopee.com.br/skate789',
    affiliateUrl: AffiliateLink.create('https://s.shopee.com.br/skate789'),
    currentPrice: Price.create(189.90),
    previousPrice: Price.create(299.90),
    discountPercentage: DiscountPercentage.create(36),
    images: ['https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=500'],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const skateResult = await adapter.generateOfferContent(skateProd, 'explosiva');
  console.log('  • Ângulo:', skateResult.analysis?.anguloDeVenda);
  console.log('  • Dor Solucionada:', skateResult.analysis?.dorQueResolve);
  console.log('  • Snippet WhatsApp:', skateResult.copies.copies.whatsAppText.substring(0, 120) + '...\n');

  // Test 4: Similaridade Jaccard entre as copys
  const similarityBagBottle = CopySimilarityValidator.calculateSimilarity(
    bagResult.copies.copies.whatsAppText,
    bottleResult.copies.copies.whatsAppText
  );
  const similarityBagSkate = CopySimilarityValidator.calculateSimilarity(
    bagResult.copies.copies.whatsAppText,
    skateResult.copies.copies.whatsAppText
  );

  console.log('📌 4. Validação de Distinção & Baixa Similaridade entre Copys:');
  console.log(`  • Similaridade (Bolsa x Garrafa): ${(similarityBagBottle * 100).toFixed(1)}% (<35% ideal)`);
  console.log(`  • Similaridade (Bolsa x Skate): ${(similarityBagSkate * 100).toFixed(1)}% (<35% ideal)`);

  if (similarityBagBottle > 0.65 || similarityBagSkate > 0.65) {
    throw new Error('❌ TESTE FALHOU: Copys de produtos diferentes apresentaram alta similaridade!');
  }

  console.log('\n===========================================================');
  console.log('🎉 AUDITORIA DE INTELIGÊNCIA SEMÂNTICA CONCLUÍDA COM SUCESSO');
  console.log('===========================================================');
  process.exit(0);
}

runSemanticAudit().catch((err) => {
  console.error('❌ ERRO NA AUDITORIA:', err.message);
  process.exit(1);
});
