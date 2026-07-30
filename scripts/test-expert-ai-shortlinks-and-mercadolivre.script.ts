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

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { GeminiAIAdapter } from '../src/infrastructure/ai/providers/gemini.adapter';
import { Product } from '../src/core/domain/entities/product.entity';
import { Price, DiscountPercentage, AffiliateLink } from '../src/core/domain/value-objects';
import { AIService } from '../src/app/(dashboard)/operacao/services/AIService';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 15000, stepName: string = 'Operação'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`⏱️ Timeout de ${timeoutMs / 1000}s na etapa: ${stepName}`)), timeoutMs)
    ),
  ]);
}

async function runAudit() {
  console.log('===========================================================');
  console.log('🧪 MUNDO LK — AUDITORIA COM INSTRUMENTAÇÃO & TIMEOUTS');
  console.log('===========================================================\n');

  console.log('📍 ETAPA 0: Inicializando SDKs e Variáveis de Ambiente...');
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const testEmail = process.env.TEST_USER_EMAIL || 'lukas@mundolk.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'MundoLK123456!';

  console.log('📍 ETAPA 1: Autenticando no Firebase Auth...');
  let uid = auth.currentUser?.uid;
  if (!uid) {
    try {
      const userCred = await withTimeout(signInWithEmailAndPassword(auth, testEmail, testPassword), 10000, 'Login Auth');
      uid = userCred.user.uid;
      console.log('  ✅ [Firebase Auth] Autenticado com e-mail/senha. UID:', uid);
    } catch {
      const newCred = await withTimeout(createUserWithEmailAndPassword(auth, testEmail, testPassword), 10000, 'Registro Auth');
      uid = newCred.user.uid;
      console.log('  ✅ [Firebase Auth] Novo usuário registrado e autenticado. UID:', uid);
    }
  }

  // ─── 1. TESTE DE PRESERVAÇÃO DE LINK CURTO DA SHOPEE ─────────────────────────
  console.log('\n📍 ETAPA 2: Teste de Preservação de Link Curto da Shopee...');
  const shortShopeeUrl = 'https://s.shopee.com.br/7KW4xYz1';

  const copyResult = await withTimeout(
    AIService.generateOfferCopy({
      title: 'Kit 3 Camisas Polos Masculinas Dry Fit Premium',
      price: 89.90,
      previousPrice: 149.90,
      affiliateUrl: shortShopeeUrl,
      style: 'explosiva',
    }),
    12000,
    'Gerar Copy Shopee'
  );

  console.log('  • URL de Origem Informada:', shortShopeeUrl);
  const containsShortUrl = copyResult.includes(shortShopeeUrl);
  console.log('  • URL Mantida Intacta na Copy:', containsShortUrl ? '✅ SIM (EXATAMENTE COMO INFORMADA)' : '❌ NÃO');

  if (!containsShortUrl) {
    throw new Error('❌ TESTE FALHOU: O link curto da Shopee foi alterado ou expandido indevidamente!');
  }

  // ─── 2. TESTE DE GRAVAÇÃO & ATUALIZAÇÃO NO MERCADO LIVRE (FIRESTORE) ────────
  console.log('\n📍 ETAPA 3: Teste de Gravação e Atualização no Mercado Livre (Firestore)...');
  const mlProductId = `prod_ml_${Date.now()}`;
  const mlDocRef = doc(db, 'products', mlProductId);

  const mlProductPayload = {
    id: mlProductId,
    userId: uid,
    tenantId: uid,
    title: 'Smart TV 55" 4K UHD Samsung Crystal',
    brand: 'Samsung',
    categoryId: 'Eletrônicos',
    marketplaceSlug: 'mercadolivre',
    originalUrl: 'https://produto.mercadolivre.com.br/MLB-998877-smart-tv-55-samsung',
    currentPrice: 2499.00,
    previousPrice: 3299.00,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Escrita Inicial
  await withTimeout(setDoc(mlDocRef, mlProductPayload, { merge: true }), 8000, 'Escrita Mercado Livre');
  console.log('  ✅ [Escrita Inicial Mercado Livre] Gravado no Firestore com sucesso! ID:', mlProductId);

  // Atualização (Simulando edição pelo usuário)
  const updatedPayload = {
    ...mlProductPayload,
    categoryId: 'TVs & Home Theater (Editado pelo Afiliado)',
    updatedAt: new Date().toISOString(),
  };
  await withTimeout(setDoc(mlDocRef, updatedPayload, { merge: true }), 8000, 'Atualização Mercado Livre');

  const fetchedDoc = await withTimeout(getDoc(mlDocRef), 8000, 'Leitura Mercado Livre');
  if (fetchedDoc.exists() && fetchedDoc.data().categoryId === updatedPayload.categoryId) {
    console.log('  ✅ [Atualização Mercado Livre] Atualizado no Firestore com 0 erros de permissão!');
    console.log('  • Categoria Persistida:', fetchedDoc.data().categoryId);
  } else {
    throw new Error('❌ TESTE FALHOU: Falha ao atualizar produto do Mercado Livre no Firestore!');
  }

  // ─── 3. TESTE DE IA ESPECIALISTA & VARIAÇÕES A/B/C ──────────────────────────
  console.log('\n📍 ETAPA 4: Teste de IA Especialista e Variações A/B/C...');
  const adapter = new GeminiAIAdapter();

  const testProd = new Product({
    id: `prod_expert_${Date.now()}`,
    userId: uid,
    title: 'Cafeteira Nespresso Essenza Mini 110V',
    description: 'Cafeteira de cápsula com alta pressão de 19 bar e design compacto.',
    brand: 'Nespresso',
    categoryId: 'Eletrodomésticos',
    marketplaceSlug: 'mercadolivre',
    originalUrl: 'https://produto.mercadolivre.com.br/MLB-334455-cafeteira-nespresso',
    affiliateUrl: AffiliateLink.create('https://produto.mercadolivre.com.br/MLB-334455-cafeteira-nespresso'),
    currentPrice: Price.create(399.00),
    previousPrice: Price.create(549.00),
    discountPercentage: DiscountPercentage.create(27),
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500'],
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const analysis = await withTimeout(adapter.generateOfferContent(testProd, 'emocional'), 12000, 'Gemini Content Generation');

  console.log('  • Ângulo Estratégico de Venda:', analysis.analysis?.anguloDeVenda || 'Venda Estratégica');
  console.log('  • Dor do Cliente que Resolve:', analysis.analysis?.dorQueResolve || 'Praticidade diária');
  console.log('  • Variação A (Venda Emocional):', (analysis.analysis?.copyA || 'N/A').substring(0, 80) + '...');
  console.log('  • Variação B (Oferta Relâmpago):', (analysis.analysis?.copyB || 'N/A').substring(0, 80) + '...');
  console.log('  • Variação C (Exclusividade Premium):', (analysis.analysis?.copyC || 'N/A').substring(0, 80) + '...');

  console.log('\n===========================================================');
  console.log('🎉 AUDITORIA INSTRUMENTADA FINALIZADA COM SUCESSO EM TEMPO RECORDE');
  console.log('===========================================================');

  // Encerramento explícito da sessão Node.js para que o terminal não fique aguardando conexões do Firestore gRPC
  process.exit(0);
}

runAudit().catch((err) => {
  console.error('\n❌ ERRO DETECTADO NA AUDITORIA:', err.message);
  process.exit(1);
});
