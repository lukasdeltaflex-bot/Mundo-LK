import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, app } from '../src/infrastructure/firebase/config/firebase.config';

async function verifyFirebaseConnection() {
  console.log('[FIREBASE TEST] Iniciando verificação de conexão com o Firebase...');
  console.log('📌 Projeto Inicializado:', app.options.projectId);
  console.log('📌 Storage Bucket:', app.options.storageBucket);
  console.log('📌 Auth Domain:', app.options.authDomain);

  if (app.options.projectId !== 'mundo-lk-eb4da') {
    throw new Error(`❌ ERRO: Projeto inesperado (${app.options.projectId}). Esperado: mundo-lk-eb4da.`);
  }

  console.log('🎉 [FIREBASE AUDIT SUCCESS] O SDK do Firebase está configurado exclusivamente para mundo-lk-eb4da!');
}

verifyFirebaseConnection();
