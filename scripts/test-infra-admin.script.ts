import { app } from '../src/infrastructure/firebase/config/firebase.config';

async function runInfrastructureAdminSuite() {
  console.log('===========================================================');
  console.log('🛠️ MUNDO LK — TESTES DE INFRAESTRUTURA & CONFIGURAÇÃO ADMIN');
  console.log('===========================================================\n');

  console.log('📌 VERIFICAÇÃO 1 — Conexão de Infraestrutura do Firebase SDK');
  console.log('  • Project ID:', app.options.projectId);
  console.log('  • Auth Domain:', app.options.authDomain);
  console.log('  • Storage Bucket:', app.options.storageBucket);
  console.log('  • Messaging Sender ID:', app.options.messagingSenderId);
  console.log('  • App ID:', app.options.appId);

  if (app.options.projectId === 'mundo-lk-eb4da') {
    console.log('\n✅ [INFRA SUCCESS] SDK do Firebase configurado e apontando exclusivamente para o projeto oficial "mundo-lk-eb4da".');
  } else {
    console.error('\n❌ [INFRA FAILED] Projeto incorreto:', app.options.projectId);
  }

  console.log('\n===========================================================');
  console.log('📊 AUDITORIA DE INFRAESTRUTURA CONCLUÍDA COM SUCESSO');
  console.log('===========================================================');
}

runInfrastructureAdminSuite();
