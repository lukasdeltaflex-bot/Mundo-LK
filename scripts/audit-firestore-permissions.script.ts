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
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

async function auditFirestorePermissions() {
  console.log('===========================================================');
  console.log('🔍 MUNDO LK — AUDITORIA TÉCNICA DE PERMISSÕES DO FIRESTORE');
  console.log('===========================================================\n');

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  console.log('📌 1. Firebase Diagnostics Check:');
  console.log('  • Project ID Configurado:', firebaseConfig.projectId);

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const testEmail = process.env.TEST_USER_EMAIL || 'lukas@mundolk.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'MundoLK123456!';

  let uid = auth.currentUser?.uid;

  if (!uid) {
    console.log(`  • Autenticando usuário no Firebase Auth (${testEmail})...`);
    try {
      const userCred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      uid = userCred.user.uid;
      console.log('  ✅ [SUCESSO] Login via Email/Senha efetuado com sucesso!');
    } catch (authErr: any) {
      console.log('  • Usuário não encontrado no Auth. Registrando novo usuário de teste no Firebase Auth...');
      try {
        const newCred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        uid = newCred.user.uid;
        console.log('  ✅ [SUCESSO] Usuário de teste registrado e autenticado no Firebase Auth! UID:', uid);
      } catch (regErr: any) {
        console.error('  ❌ Erro ao registrar usuário no Firebase Auth:', regErr.message);
      }
    }
  }

  console.log('\n📌 2. Estado do Usuário Autenticado:');
  console.log('  • UID:', uid);
  console.log('  • Auth CurrentUser Presente:', Boolean(auth.currentUser));
  console.log('  • Email:', auth.currentUser?.email || testEmail);
  console.log('  • TenantId (ou User UID):', uid);

  // 🧪 TESTE 1: Gravação na Coleção 'marketplace_connections' (Configurações de APIs)
  console.log('\n📌 3. Teste de Gravação na Coleção "marketplace_connections" (Configuração de APIs):');
  const connDocId = `conn_${uid}_mercadolivre`;
  const connRef = doc(db, 'marketplace_connections', connDocId);
  const connPayload = {
    id: connDocId,
    userId: uid,
    tenantId: uid,
    marketplaceSlug: 'mercadolivre',
    name: 'Mercado Livre Oficial Audit',
    status: 'ACTIVE',
    credentials: {
      clientId: '5566961113388868',
      // Client secret omitido nos logs de diagnósticos por segurança
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(connRef, connPayload, { merge: true });
    console.log('  ✅ [SUCESSO] Gravação efetuada no Firestore na coleção "marketplace_connections".');

    const snap = await getDoc(connRef);
    if (snap.exists()) {
      console.log('  ✅ [SUCESSO] Leitura confirmada no Firestore!');
    }
  } catch (err: any) {
    console.error('  ❌ [ERRO DE PERMISSÃO EM MARKETPLACE_CONNECTIONS]:', err.message);
  }

  // 🧪 TESTE 2: Gravação na Coleção 'offers' (Ofertas de Afiliados)
  console.log('\n📌 4. Teste de Gravação na Coleção "offers" (Ofertas de Afiliados):');
  const offerDocId = `off_audit_${Date.now()}`;
  const offerRef = doc(db, 'offers', offerDocId);
  const offerPayload = {
    id: offerDocId,
    productId: 'prod_sauvage_01',
    userId: uid,
    tenantId: uid,
    scoreValue: 95,
    scoreLabel: 'EXCELLENT',
    scoreJustification: 'Oferta com excelente potencial comercial.',
    copies: { whatsAppText: '🔥 Perfume Sauvage Dior em promoção!' },
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(offerRef, offerPayload, { merge: true });
    console.log('  ✅ [SUCESSO] Gravação efetuada no Firestore na coleção "offers".');

    const snap = await getDoc(offerRef);
    if (snap.exists()) {
      console.log('  ✅ [SUCESSO] Leitura confirmada no Firestore!');
    }
  } catch (err: any) {
    console.error('  ❌ [ERRO DE PERMISSÃO EM OFFERS]:', err.message);
  }

  // 🧪 TESTE 3: Gravação na Coleção 'products' (Produtos)
  console.log('\n📌 5. Teste de Gravação na Coleção "products" (Produtos):');
  const prodDocId = `prod_audit_${Date.now()}`;
  const prodRef = doc(db, 'products', prodDocId);
  const prodPayload = {
    id: prodDocId,
    userId: uid,
    tenantId: uid,
    title: 'Perfume Importado Sauvage Dior 100ml',
    currentPrice: 689.90,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(prodRef, prodPayload, { merge: true });
    console.log('  ✅ [SUCESSO] Gravação efetuada no Firestore na coleção "products".');

    const snap = await getDoc(prodRef);
    if (snap.exists()) {
      console.log('  ✅ [SUCESSO] Leitura confirmada no Firestore!');
    }
  } catch (err: any) {
    console.error('  ❌ [ERRO DE PERMISSÃO EM PRODUCTS]:', err.message);
  }

  console.log('\n===========================================================');
  console.log('🎉 AUDITORIA DE REGRAS E PERMISSÕES DO FIRESTORE FINALIZADA');
  console.log('===========================================================');
}

auditFirestorePermissions();
