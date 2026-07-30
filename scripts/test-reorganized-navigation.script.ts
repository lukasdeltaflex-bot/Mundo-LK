import fs from 'fs';
import path from 'path';

async function testReorganizedNavigation() {
  console.log('===========================================================');
  console.log('🧭 MUNDO LK — TESTE DE REORGANIZAÇÃO DE NAVEGAÇÃO & CONFIGURAÇÕES');
  console.log('===========================================================\n');

  // 1. Verificação do Arquivo MenuOrderContext.tsx
  const menuContextPath = path.resolve(process.cwd(), 'src/presentation/context/MenuOrderContext.tsx');
  const menuContent = fs.readFileSync(menuContextPath, 'utf-8');

  console.log('📌 1. Verificação do Menu Lateral Principal:');
  const includesBackupInMain = menuContent.includes("id: 'backup'");
  const includesAparenciaInMain = menuContent.includes("id: 'aparencia'");
  const includesConfiguracoesInMain = menuContent.includes("id: 'configuracoes'");

  console.log('  • "Backup Manager" removido do menu principal:', !includesBackupInMain ? '✅ SIM' : '❌ NÃO');
  console.log('  • "Aparência" removida do menu principal:', !includesAparenciaInMain ? '✅ SIM' : '❌ NÃO');
  console.log('  • "Configurações" presente no menu principal:', includesConfiguracoesInMain ? '✅ SIM' : '❌ NÃO');

  if (includesBackupInMain || includesAparenciaInMain || !includesConfiguracoesInMain) {
    throw new Error('❌ TESTE FALHOU: O menu lateral principal ainda possui itens antigos soltos.');
  }

  // 2. Verificação do Componente de Configurações
  const configPagePath = path.resolve(process.cwd(), 'src/app/(dashboard)/configuracoes/page.tsx');
  const configContent = fs.readFileSync(configPagePath, 'utf-8');

  console.log('\n📌 2. Verificação das Seções na Página /configuracoes:');
  const hasAparenciaTab = configContent.includes("activeTab === 'aparencia'");
  const hasBackupTab = configContent.includes("activeTab === 'backup'");
  const hasPerfilTab = configContent.includes("activeTab === 'perfil'");
  const hasIntegracoesTab = configContent.includes("activeTab === 'integracoes'");

  console.log('  • Seção Aparência Incorporada:', hasAparenciaTab ? '✅ SIM' : '❌ NÃO');
  console.log('  • Seção Backup Manager Incorporada:', hasBackupTab ? '✅ SIM' : '❌ NÃO');
  console.log('  • Seção Perfil & IA Incorporada:', hasPerfilTab ? '✅ SIM' : '❌ NÃO');
  console.log('  • Seção Integrações Incorporada:', hasIntegracoesTab ? '✅ SIM' : '❌ NÃO');

  if (!hasAparenciaTab || !hasBackupTab || !hasPerfilTab || !hasIntegracoesTab) {
    throw new Error('❌ TESTE FALHOU: A página de configurações não incorporou todas as seções.');
  }

  // 3. Verificação de Redirecionamentos de Rota Legados
  const legacyAparenciaPath = path.resolve(process.cwd(), 'src/app/(dashboard)/configuracoes/aparencia/page.tsx');
  const legacyBackupPath = path.resolve(process.cwd(), 'src/app/(dashboard)/backup/page.tsx');

  const aparenciaRedirect = fs.readFileSync(legacyAparenciaPath, 'utf-8').includes("router.replace('/configuracoes?tab=aparencia')");
  const backupRedirect = fs.readFileSync(legacyBackupPath, 'utf-8').includes("router.replace('/configuracoes?tab=backup')");

  console.log('\n📌 3. Verificação dos Redirecionamentos de Rotas Antigas:');
  console.log('  • Redirecionamento de /configuracoes/aparencia:', aparenciaRedirect ? '✅ SIM' : '❌ NÃO');
  console.log('  • Redirecionamento de /backup:', backupRedirect ? '✅ SIM' : '❌ NÃO');

  if (!aparenciaRedirect || !backupRedirect) {
    throw new Error('❌ TESTE FALHOU: Redirecionamentos de rotas antigas não foram configurados.');
  }

  console.log('\n===========================================================');
  console.log('🎉 AUDITORIA DA NAVEGAÇÃO E CONFIGURAÇÕES CONCLUÍDA COM SUCESSO');
  console.log('===========================================================');
}

testReorganizedNavigation();
