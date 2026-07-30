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

async function runAIOrchestratorPipelineVerification() {
  console.log('===========================================================');
  console.log('🧪 MUNDO LK — TESTE DO AI ORCHESTRATOR PIPELINE');
  console.log('===========================================================\n');

  const testProduct = new Product({
    id: 'prod_orchestrator_test',
    userId: 'usr_orchestrator',
    title: 'Perfume Sauvage Dior Eau de Parfum 100ml Importado',
    description: 'Perfume masculino amadeirado especiado com alta fixação e projeção marcante.',
    brand: 'Dior',
    categoryId: 'Perfumaria',
    marketplaceSlug: 'shopee',
    originalUrl: 'https://s.shopee.com.br/sauvage123',
    affiliateUrl: AffiliateLink.create('https://s.shopee.com.br/sauvage123'),
    currentPrice: Price.create(699.00),
    previousPrice: Price.create(899.00),
    discountPercentage: DiscountPercentage.create(22),
    images: ['https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500'],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('📌 [1/3] Executando pipeline do AIOrchestrator...');
  const result = await AIOrchestrator.generateOffer({
    product: testProduct,
    userId: 'usr_orchestrator',
    style: 'premium',
    commercialGoal: 'maxima_conversao',
    generationMode: 'profissional',
  });

  console.log('\n--- SAÍDA DO AI ORCHESTRATOR ---');
  console.log(`• Duração: ${result.durationMs}ms`);
  console.log(`• Cache Hit: ${result.cacheHit}`);
  console.log(`• Originalidade: ${result.objectiveMetrics?.originalityPercent}%`);
  console.log(`• Persuasão: ${result.objectiveMetrics?.persuasionPercent}%`);
  console.log(`• CTA: "${result.analysis?.cta}"`);
  console.log(`• Trecho WhatsApp: "${result.analysis?.whatsAppText.substring(0, 90).replace(/\n/g, ' ')}..."`);
  console.log('--------------------------------\n');

  if (!result.analysis || !result.analysis.whatsAppText || !result.analysis.cta) {
    throw new Error('❌ Falha no retorno validado pelo AIOrchestrator!');
  }

  console.log('===========================================================');
  console.log('🎉 PIPELINE DO AI ORCHESTRATOR VALIDADO COM SUCESSO');
  console.log('===========================================================');
  process.exit(0);
}

runAIOrchestratorPipelineVerification().catch((err) => {
  console.error('❌ ERRO NO TESTE DO AI ORCHESTRATOR:', err.message);
  process.exit(1);
});
