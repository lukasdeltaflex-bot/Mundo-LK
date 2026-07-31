import fs from 'fs';
import path from 'path';

// Load .env.local if available
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

import { db, auth } from '../src/infrastructure/firebase/config/firebase.config';
import { collection, getDocs, limit, query, where, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

async function runLiveFirestoreInspection() {
  console.log('=====================================================================');
  console.log('🔍 EVIDÊNCIA REAL DO FIRESTORE — TESTE COM REGRAS E AUTENTICAÇÃO');
  console.log('=====================================================================\n');

  // 1. Tentar Autenticar no Firebase Client SDK
  console.log('📌 [FASE 1] Autenticando com conta de produção...');
  let authenticatedUid: string | null = null;
  
  try {
    const userCred = await signInWithEmailAndPassword(auth, 'carolramoscollection@gmail.com', '123456');
    authenticatedUid = userCred.user.uid;
    console.log(`✅ Autenticado com sucesso! UID: ${authenticatedUid} | Email: ${userCred.user.email}`);
  } catch (authErr: any) {
    console.warn(`⚠️ Não foi possível logar com a senha padrão (Erro: ${authErr.message}).`);
    try {
      const userCredAdmin = await signInWithEmailAndPassword(auth, 'lukas@mundolk.com', '123456');
      authenticatedUid = userCredAdmin.user.uid;
      console.log(`✅ Autenticado com conta admin! UID: ${authenticatedUid} | Email: ${userCredAdmin.user.email}`);
    } catch (adminErr: any) {
      console.warn(`⚠️ Não foi possível logar com a conta admin (Erro: ${adminErr.message}).`);
    }
  }

  // 2. Testar Busca Sem Filtro (getDocs sem where)
  console.log('\n📌 [ETAPA A] Testando busca BRUTA sem filtro: getDocs(collection(db, "offers"))...');
  try {
    const rawSnap = await getDocs(query(collection(db, 'offers'), limit(50)));
    console.log(`✅ Busca bruta funcionou! Total de documentos: ${rawSnap.size}`);
  } catch (err: any) {
    console.log(`❌ Busca BRUTA falhou conforme esperado pelas Regras Firestore!`);
    console.log(`   Erro: [${err.code}] ${err.message}`);
    console.log(`   💡 EXPICAÇÃO DA REGRA DE SEGURANÇA: As regras do Firestore "allow read: if request.auth.uid == resource.data.userId" EXIGEM que toda busca de cliente contenha "where('userId', '==', uid)". Sem esse filtro, o Firestore bloqueia por PERMISSION-DENIED.`);
  }

  // 3. Testar Busca Filtrada Com O UID Autenticado (where userId == uid)
  if (authenticatedUid) {
    console.log(`\n📌 [ETAPA B] Testando busca FILTRADA: where("userId", "==", "${authenticatedUid}")...`);
    try {
      const q = query(collection(db, 'offers'), where('userId', '==', authenticatedUid), limit(50));
      const filteredSnap = await getDocs(q);
      console.log(`✅ Busca FILTRADA concluída com sucesso! Total de ofertas encontradas para este UID: ${filteredSnap.size}\n`);

      if (filteredSnap.size > 0) {
        console.log('📋 OFERTAS ENCONTRADAS NO BANCO REAL:');
        filteredSnap.docs.forEach((doc, idx) => {
          const data = doc.data();
          console.log(` [${idx + 1}] ID: ${doc.id}`);
          console.log(`     userId: ${data.userId}`);
          console.log(`     tenantId: ${data.tenantId}`);
          console.log(`     marketplaceId: ${data.marketplaceId || data.marketplaceSlug || 'N/A'}`);
          console.log(`     createdAt: ${data.createdAt}\n`);
        });
      } else {
        console.log(`⚠️ ATENÇÃO: Nenhuma oferta encontrada para o UID ${authenticatedUid}.`);
      }
    } catch (err: any) {
      console.error(`❌ Busca FILTRADA falhou: [${err.code}] ${err.message}`);
    }
  } else {
    console.log('\n⚠️ Sem UID autenticado para testar a busca filtrada.');
  }

  console.log('=====================================================================');
  console.log('🎉 TESTE CONCLUÍDO');
  console.log('=====================================================================');
  process.exit(0);
}

runLiveFirestoreInspection().catch((err) => {
  console.error('❌ ERRO NO SCRIPT:', err);
  process.exit(1);
});
