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

import { PipelineFactory } from '../src/core/domain/pipeline/PipelineFactory';
import { AIOrchestrator } from '../src/core/domain/services/AIOrchestrator';
import { Product } from '../src/core/domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '../src/core/domain/value-objects';

async function runPipelineFactoryVerification() {
  console.log('===========================================================');
  console.log('🧪 MUNDO LK — TESTE DO PIPELINEFACTORY & ESTÁGIOS ISOLADOS');
  console.log('===========================================================\n');

  console.log('📌 [1/3] Testando instanciação por fábrica (PipelineFactory)...');
  const copyPipeline = PipelineFactory.createPipeline('COPY_GENERATION');
  const productPipeline = PipelineFactory.createPipeline('PRODUCT_ANALYSIS');
  const seoPipeline = PipelineFactory.createPipeline('SEO_ANALYSIS');

  console.log(`  • COPY_GENERATION Pipeline: ${copyPipeline.length} estágios (${copyPipeline.map(s => s.name).join(' -> ')})`);
  console.log(`  • PRODUCT_ANALYSIS Pipeline: ${productPipeline.length} estágios (${productPipeline.map(s => s.name).join(' -> ')})`);
  console.log(`  • SEO_ANALYSIS Pipeline: ${seoPipeline.length} estágios (${seoPipeline.map(s => s.name).join(' -> ')})`);

  if (copyPipeline.length !== 7 || productPipeline.length !== 4) {
    throw new Error('❌ Falha na contagem de estágios da fábrica PipelineFactory!');
  }

  const testProduct = new Product({
    id: 'prod_factory_test',
    userId: 'usr_factory_test',
    title: 'Mochila Impermeável Executiva com Entrada USB',
    description: 'Mochila para notebook com compartimentos organizadores e resistência à água.',
    brand: 'ExecBrand',
    categoryId: 'Acessórios',
    marketplaceSlug: 'shopee',
    originalUrl: 'https://s.shopee.com.br/mochila123',
    affiliateUrl: AffiliateLink.create('https://s.shopee.com.br/mochila123'),
    currentPrice: Price.create(119.90),
    previousPrice: Price.create(179.90),
    discountPercentage: DiscountPercentage.create(33),
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('\n📌 [2/3] Executando pipeline via AIOrchestrator com PipelineFactory...');
  const ctx = await AIOrchestrator.generateOffer({
    product: testProduct,
    userId: 'usr_factory_test',
    style: 'padrao',
    commercialGoal: 'maxima_conversao',
    generationMode: 'profissional',
    workflowMode: 'COPY_GENERATION',
  });

  console.log('\n--- DIAGNÓSTICO DO PIPELINEFACTORY ---');
  console.log(`• Tempo de Execução: ${ctx.durationMs}ms`);
  console.log(`• Cache Hit: ${ctx.cacheHit}`);
  console.log(`• CTA Gerada: "${ctx.analysis?.cta}"`);
  console.log(`• Originalidade: ${ctx.objectiveMetrics?.originalityPercent}%`);
  console.log('--------------------------------------\n');

  if (!ctx.analysis || !ctx.analysis.whatsAppText) {
    throw new Error('❌ Falha na execução do pipeline via PipelineFactory!');
  }

  console.log('===========================================================');
  console.log('🎉 PIPELINEFACTORY & ESTÁGIOS ISOLADOS VALIDADOS COM SUCESSO');
  console.log('===========================================================');
  process.exit(0);
}

runPipelineFactoryVerification().catch((err) => {
  console.error('❌ ERRO NO TESTE DO PIPELINEFACTORY:', err.message);
  process.exit(1);
});
