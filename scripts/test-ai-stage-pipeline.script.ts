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

import { AIOrchestrator } from '../src/core/domain/services/AIOrchestrator';
import { Product } from '../src/core/domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '../src/core/domain/value-objects';

async function runAIStagePipelineVerification() {
  console.log('===========================================================');
  console.log('🧪 MUNDO LK — TESTE DO PIPELINE DE ESTÁGIOS EXTENSÍVEL (AISTAGE)');
  console.log('===========================================================\n');

  const testProduct = new Product({
    id: 'prod_stage_pipeline_test',
    userId: 'usr_pipeline_test',
    title: 'Garrafa Térmica Mantém Gelado 24h Inox 1L',
    description: 'Garrafa com isolamento térmico de parede dupla em aço inox.',
    brand: 'ThermoBrand',
    categoryId: 'Casa & Cozinha',
    marketplaceSlug: 'shopee',
    originalUrl: 'https://s.shopee.com.br/garrafa123',
    affiliateUrl: AffiliateLink.create('https://s.shopee.com.br/garrafa123'),
    currentPrice: Price.create(79.90),
    previousPrice: Price.create(119.90),
    discountPercentage: DiscountPercentage.create(33),
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('📌 [1/2] Executando pipeline extensível de estágios...');
  const ctx = await AIOrchestrator.generateOffer({
    product: testProduct,
    userId: 'usr_pipeline_test',
    style: 'custo_beneficio',
    commercialGoal: 'maxima_conversao',
    generationMode: 'profissional',
    policy: 'BALANCED',
  });

  console.log('\n--- SAÍDA DO AISTAGE PIPELINE ---');
  console.log(`• Duração da Pipeline: ${ctx.durationMs}ms`);
  console.log(`• Flags Ativas:`, ctx.flags);
  console.log(`• Hash do Prompt: ${ctx.promptHash}`);
  console.log(`• CTA Validada: "${ctx.analysis?.cta}"`);
  console.log(`• Originalidade: ${ctx.objectiveMetrics?.originalityPercent}%`);
  console.log('---------------------------------\n');

  if (!ctx.analysis || !ctx.analysis.whatsAppText) {
    throw new Error('❌ Falha na execução do pipeline de estágios!');
  }

  console.log('===========================================================');
  console.log('🎉 PIPELINE DE ESTÁGIOS (AISTAGE) VALIDADO COM SUCESSO');
  console.log('===========================================================');
  process.exit(0);
}

runAIStagePipelineVerification().catch((err) => {
  console.error('❌ ERRO NO TESTE DO PIPELINE DE ESTÁGIOS:', err.message);
  process.exit(1);
});
