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

async function run20ProductsAudit() {
  console.log('===========================================================');
  console.log('🧪 MUNDO LK — AUDITORIA REAL DE 20 PRODUTOS DIVERSOS (GEMINI 2.5 FLASH)');
  console.log('===========================================================\n');

  const productsList = [
    { title: 'Bolsa Feminina Couro Legítimo Arezzo Classic', category: 'Moda Feminina', price: 249.90 },
    { title: 'Perfume Sauvage Dior Eau de Parfum 100ml', category: 'Perfumaria', price: 699.00 },
    { title: 'Garrafa Térmica 1L Inox Vacuum Mantém Gelado', category: 'Casa & Cozinha', price: 79.90 },
    { title: 'Skate Completo Profissional Shape Maple Abec-9', category: 'Esporte & Lazer', price: 189.90 },
    { title: 'Notebook Dell Inspiron 15 Intel i7 16GB SSD 512GB', category: 'Informática', price: 3899.00 },
    { title: 'Smartphone Samsung Galaxy S24 Ultra 512GB 5G', category: 'Celulares', price: 5499.00 },
    { title: 'Smart TV 55" 4K UHD Samsung Crystal Neo QLED', category: 'Eletrônicos', price: 2799.00 },
    { title: 'Liquidificador Oster Power 1400W Jarra de Vidro', category: 'Eletrodomésticos', price: 219.90 },
    { title: 'Tênis Nike Revolution 7 Corrida Masculino', category: 'Calçados', price: 299.90 },
    { title: 'Mochila Impermeável Executiva com Entrada USB', category: 'Acessórios', price: 119.90 },
    { title: 'Relógio Cassio G-Shock Masculino Esportivo', category: 'Relógios', price: 450.00 },
    { title: 'Aspirador de Pó Vertical Robô Midea Wi-Fi', category: 'Eletrodomésticos', price: 899.00 },
    { title: 'Fone de Ouvido Bluetooth JBL Tune 520BT Sem Fio', category: 'Áudio', price: 229.90 },
    { title: 'Cafeteira Nespresso Essenza Mini 110V Vermelha', category: 'Eletrodomésticos', price: 399.00 },
    { title: 'Cadeira Gamer Ergonomica Reclinável com Apoio', category: 'Móveis', price: 799.00 },
    { title: 'Mouse Sem Fio Logitech MX Master 3S Recarregável', category: 'Periféricos', price: 499.00 },
    { title: 'Teclado Mecânico RGB Redragon Kumara Switch Blue', category: 'Periféricos', price: 219.00 },
    { title: 'Jaqueta Couro Sintético Motoqueiro com Capuz', category: 'Moda Masculina', price: 189.00 },
    { title: 'Mala de Viagem P Rígida Roda 360 Graus Segredo', category: 'Viagem', price: 239.00 },
    { title: 'Smartwatch Amazfit Bip 5 Tela 1.91 HD GPS', category: 'Smartwatches', price: 349.00 },
  ];

  const adapter = new GeminiAIAdapter();
  const generatedCopies: string[] = [];

  for (let i = 0; i < productsList.length; i++) {
    const item = productsList[i];
    console.log(`📍 [${i + 1}/20] Analisando: ${item.title} (${item.category})...`);

    const prod = new Product({
      id: `prod_audit_${i + 1}`,
      userId: 'audit_admin',
      title: item.title,
      description: `Produto oficial ${item.title} de alta qualidade.`,
      brand: 'Marca Oficial',
      categoryId: item.category,
      marketplaceSlug: 'mercadolivre',
      originalUrl: `https://s.shopee.com.br/item_${i + 1}`,
      affiliateUrl: AffiliateLink.create(`https://s.shopee.com.br/item_${i + 1}`),
      currentPrice: Price.create(item.price),
      previousPrice: Price.create(item.price * 1.3),
      discountPercentage: DiscountPercentage.create(23),
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await adapter.generateOfferContent(prod, 'padrao', 'maxima_conversao', 'profissional');
    const copyText = res.copies.copies.whatsAppText;
    generatedCopies.push(copyText);

    console.log(`   • Ângulo Semântico: ${res.analysis?.anguloDeVenda || 'Custo-Benefício'}`);
    console.log(`   • Dor Solucionada: ${res.analysis?.dorQueResolve || 'Atendida'}`);
    console.log(`   • Tamanho da Copy: ${copyText.length} caracteres`);
  }

  console.log('\n📌 Calculando Matriz de Similaridade entre os 20 Produtos...');
  let totalSim = 0;
  let pairCount = 0;

  for (let i = 0; i < generatedCopies.length; i++) {
    for (let j = i + 1; j < generatedCopies.length; j++) {
      const sim = CopySimilarityValidator.calculateSimilarity(generatedCopies[i], generatedCopies[j]);
      totalSim += sim;
      pairCount++;
    }
  }

  const avgSimilarity = (totalSim / pairCount) * 100;
  console.log(`  • Similaridade Média Global entre Produtos: ${avgSimilarity.toFixed(1)}% (<35% ideal)`);

  if (avgSimilarity > 50) {
    throw new Error('❌ TESTE FALHOU: A similaridade média entre os 20 produtos ultrapassou o limite seguro!');
  }

  console.log('\n===========================================================');
  console.log('🎉 AUDITORIA REAL DE 20 PRODUTOS DIVERSOS CONCLUÍDA COM SUCESSO');
  console.log('===========================================================');
  process.exit(0);
}

run20ProductsAudit().catch((err) => {
  console.error('❌ ERRO NA AUDITORIA DOS 20 PRODUTOS:', err.message);
  process.exit(1);
});
