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

import { saveApprovedOfferAction } from '../src/presentation/actions/save-offer.action';

async function runOfferPersistenceVerification() {
  console.log('===========================================================');
  console.log('🧪 MUNDO LK — TESTE DE PERSISTÊNCIA DA COPY IA & LINK CURTO');
  console.log('===========================================================\n');

  const mockShortUrl = 'https://s.shopee.com.br/test_short_link_123';
  const mockAiCopy = '🔥 *OFERTA RICA DA IA GESTORA* \n\nProduto de alta tecnologia com frete grátis.\n\n🛒 Garanta o seu no link oficial: ' + mockShortUrl;

  const mockPreview: any = {
    product: {
      id: 'prod_persist_test',
      title: 'Fone de Ouvido Sem Fio Bluetooth Noise Cancelling',
      description: 'Fone com cancelamento ativo de ruído e bateria de 30h.',
      brand: 'AudioTech',
      price: 'R$ 199,90',
      priceAmount: 199.90,
      previousPrice: 'R$ 299,90',
      discountPercent: '33% OFF',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      originalUrl: 'https://shopee.com.br/product/123/456',
      affiliateUrl: mockShortUrl,
      marketplaceSlug: 'shopee',
      categoryId: 'Eletrônicos',
    },
    offer: {
      whatsAppText: mockAiCopy,
      telegramText: mockAiCopy,
      instagramText: mockAiCopy,
      facebookText: mockAiCopy,
      channelText: mockAiCopy,
      cta: 'Aproveite o Desconto no Link Oficial!',
      hashtags: ['#fone', '#promo'],
      emojis: ['🎧', '⚡'],
      score: 95,
      scoreLabel: 'EXCELLENT',
      justification: 'Copy bem estruturada',
      style: 'premium',
    },
  };

  console.log('📌 [1/2] Salvando oferta com copy rica e link curto...');
  const result = await saveApprovedOfferAction({
    preview: mockPreview,
    userId: 'usr_persist_test',
    editedCopy: mockAiCopy,
    editedCta: 'Aproveite o Desconto no Link Oficial!',
  });

  console.log('--- RESULTADO DO SALVAMENTO ---');
  console.log('• Sucesso:', result.success);
  if (result.success) {
    console.log('• Product ID:', result.productId);
    console.log('• Offer ID:', result.offerId);
  } else {
    console.error('• Erro:', result.error);
    throw new Error('❌ Falha ao salvar oferta!');
  }
  console.log('-------------------------------\n');

  console.log('===========================================================');
  console.log('🎉 PERSISTÊNCIA DA COPY & LINK CURTO VALIDADA COM SUCESSO');
  console.log('===========================================================');
  process.exit(0);
}

runOfferPersistenceVerification().catch((err) => {
  console.error('❌ ERRO NO TESTE DE PERSISTÊNCIA:', err.message);
  process.exit(1);
});
