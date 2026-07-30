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

import { GeminiAIAdapter, OfferStyle, getStyleTemperature } from '../src/infrastructure/ai/providers/gemini.adapter';
import { Product } from '../src/core/domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '../src/core/domain/value-objects';
import { CopySimilarityValidator } from '../src/core/domain/services/CopySimilarityValidator';

async function run15StylesAudit() {
  console.log('===========================================================');
  console.log('🧪 MUNDO LK — AUDITORIA DOS 15 ESTILOS DE COPY (TEMPERATURA 0.3 A 1.2)');
  console.log('===========================================================\n');

  const styles: OfferStyle[] = [
    'padrao', 'explosiva', 'premium', 'urgencia', 'minimalista',
    'emocional', 'promocao', 'custo_beneficio', 'familia', 'tecnologia',
    'casa', 'esporte', 'presentes', 'relampago', 'luxo'
  ];

  const testProduct = new Product({
    id: 'prod_styles_benchmark',
    userId: 'audit_admin',
    title: 'Smartwatch Amazfit Bip 5 Tela 1.91 HD GPS Integrado',
    description: 'Relógio inteligente com monitoramento de saúde, mais de 120 modos de treino e bateria de 10 dias.',
    brand: 'Amazfit',
    categoryId: 'Smartwatches',
    marketplaceSlug: 'mercadolivre',
    originalUrl: 'https://s.shopee.com.br/amazfit123',
    affiliateUrl: AffiliateLink.create('https://s.shopee.com.br/amazfit123'),
    currentPrice: Price.create(349.00),
    previousPrice: Price.create(499.00),
    discountPercentage: DiscountPercentage.create(30),
    images: ['https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500'],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const adapter = new GeminiAIAdapter();
  const styleCopies: Record<string, string> = {};

  for (const st of styles) {
    const temp = getStyleTemperature(st);
    console.log(`📍 Gerando para estilo [${st.toUpperCase()}] (Temperatura: ${temp})...`);

    const res = await adapter.generateOfferContent(testProduct, st, 'maxima_conversao', 'profissional');
    const copyText = res.copies.copies.whatsAppText;
    styleCopies[st] = copyText;

    console.log(`   • Ângulo: ${res.analysis?.anguloDeVenda || 'N/A'}`);
    console.log(`   • Trecho WhatsApp: "${copyText.substring(0, 90).replace(/\n/g, ' ')}..."\n`);
  }

  console.log('📌 Calculando Matriz de Similaridade entre os 15 Estilos...');
  let totalSim = 0;
  let pairCount = 0;

  for (let i = 0; i < styles.length; i++) {
    for (let j = i + 1; j < styles.length; j++) {
      const stA = styles[i];
      const stB = styles[j];
      const sim = CopySimilarityValidator.calculateSimilarity(styleCopies[stA], styleCopies[stB]);
      totalSim += sim;
      pairCount++;
    }
  }

  const avgSimilarity = (totalSim / pairCount) * 100;
  console.log(`  • Similaridade Média entre os 15 Estilos: ${avgSimilarity.toFixed(1)}% (<40% ideal)`);

  if (avgSimilarity > 55) {
    throw new Error('❌ TESTE FALHOU: A similaridade média entre os 15 estilos foi excessivamente alta!');
  }

  console.log('\n===========================================================');
  console.log('🎉 AUDITORIA DOS 15 ESTILOS CONCLUÍDA COM SUCESSO');
  console.log('===========================================================');
  process.exit(0);
}

run15StylesAudit().catch((err) => {
  console.error('❌ ERRO NA AUDITORIA DOS 15 ESTILOS:', err.message);
  process.exit(1);
});
