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
import { Price } from '../src/core/domain/value-objects/price.vo';
import { AffiliateLink } from '../src/core/domain/value-objects/affiliate-link.vo';
import { DiscountPercentage } from '../src/core/domain/value-objects/discount-percentage.vo';
import { AIService } from '../src/app/(dashboard)/operacao/services/AIService';

async function auditAICopyGeneration() {
  console.log('===========================================================');
  console.log('🤖 MUNDO LK — AUDITORIA TÉCNICA DE GERAÇÃO DE COPY COM IA REAL');
  console.log('===========================================================\n');

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  console.log('📌 CHECK 1 — Verificação da Chave de API da IA:');
  console.log('  • GEMINI_API_KEY Presente:', Boolean(process.env.GEMINI_API_KEY));
  console.log('  • Modelo Oficial:', 'gemini-2.5-flash');
  console.log('  • Endpoint REST:', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent\n');

  if (!apiKey) {
    throw new Error('❌ AUDITORIA REPROVADA: Chave GEMINI_API_KEY não encontrada no ambiente.');
  }

  const geminiAdapter = new GeminiAIAdapter();

  // Lista de 3 produtos completamente diferentes para o teste de consistência
  const testProducts = [
    {
      id: 'prod_perfume_01',
      title: 'Perfume Importado Sauvage Dior Eau de Parfum 100ml',
      price: 689.90,
      originalPrice: 899.00,
      url: 'https://produto.mercadolivre.com.br/MLB-112233-perfume-sauvage-dior',
      category: 'Perfumaria & Beleza',
    },
    {
      id: 'prod_smartphone_02',
      title: 'Smartphone Samsung Galaxy S24 Ultra 512GB 5G Câmera 200MP',
      price: 6299.00,
      originalPrice: 7999.00,
      url: 'https://shopee.com.br/product/12345/67890-galaxy-s24-ultra',
      category: 'Eletrônicos & Celulares',
    },
    {
      id: 'prod_tenis_03',
      title: 'Tênis Nike Air Force 1 07 Masculino Couro Branco',
      price: 799.99,
      originalPrice: 999.99,
      url: 'https://produto.mercadolivre.com.br/MLB-998877-tenis-nike-air-force',
      category: 'Calçados & Esporte',
    },
  ];

  console.log('===========================================================');
  console.log('🧪 TESTE DE CONSISTÊNCIA DEDICADO — 3 PRODUTOS DISTINTOS');
  console.log('===========================================================\n');

  for (const p of testProducts) {
    console.log(`📦 PRODUTO TESTADO: ${p.title}`);
    console.log(`  • Categoria: ${p.category}`);
    const currPrice = Price.create(p.price);
    const prevPrice = Price.create(p.originalPrice);

    const productEntity = new Product({
      id: p.id,
      userId: 'usr_audit_01',
      title: p.title,
      description: p.title,
      brand: 'Marca Auditada',
      categoryId: p.category,
      marketplaceSlug: p.url.includes('shopee') ? 'shopee' : 'mercadolivre',
      originalUrl: p.url,
      affiliateUrl: AffiliateLink.create(p.url),
      currentPrice: currPrice,
      previousPrice: prevPrice,
      discountPercentage: DiscountPercentage.calculate(currPrice, prevPrice),
      images: ['https://http2.mlstatic.com/D_NQ_NP_2X_612255-F.webp'],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const startTime = Date.now();
    const result = await geminiAdapter.generateOfferContent(productEntity, 'explosiva');
    const latencyMs = Date.now() - startTime;

    console.log(`⚡ TEMPO DE RESPOSTA DA IA REAL: ${latencyMs} ms`);
    console.log(`🧠 CONTEÚDO GERADO PELO MODELO GEMINI 2.5 FLASH:`);
    console.log('  ---------------------------------------------------------');
    console.log('  📱 WhatsApp Text:');
    console.log('   ', (result.copies.copies.whatsAppText || 'N/A').split('\n').join('\n    '));
    console.log('  ---------------------------------------------------------');
    console.log('  📸 Instagram Text:');
    console.log('   ', (result.copies.copies.instagramText || 'N/A').split('\n').join('\n    '));
    console.log('  ---------------------------------------------------------\n');
  }

  console.log('===========================================================');
  console.log('📊 AUDITORIA CONCLUÍDA: A IA REAL (GEMINI 2.5 FLASH) FOI EXECUTADA COM SUCESSO');
  console.log('===========================================================');
}

auditAICopyGeneration();
