import fs from 'fs';
import path from 'path';

async function testCentralInteligenteHub() {
  console.log('===========================================================');
  console.log('🧠 MUNDO LK — TESTE DE REORGANIZAÇÃO: CENTRAL INTELIGENTE');
  console.log('===========================================================\n');

  // 1. Verificação do Menu Lateral em MenuOrderContext.tsx
  const menuContextPath = path.resolve(process.cwd(), 'src/presentation/context/MenuOrderContext.tsx');
  const menuContent = fs.readFileSync(menuContextPath, 'utf-8');

  console.log('📌 1. Verificação da Entrada "Central Inteligente" no Menu Lateral:');
  const hasCentralInteligente = menuContent.includes("id: 'central-inteligente'");
  console.log('  • "Central Inteligente" declarada no menu lateral principal:', hasCentralInteligente ? '✅ SIM' : '❌ NÃO');

  if (!hasCentralInteligente) {
    throw new Error('❌ TESTE FALHOU: "Central Inteligente" não foi declarada em MenuOrderContext.tsx');
  }

  // 2. Verificação do Hub Central Inteligente (/central-inteligente/page.tsx)
  const hubPath = path.resolve(process.cwd(), 'src/app/(dashboard)/central-inteligente/page.tsx');
  const hubContent = fs.readFileSync(hubPath, 'utf-8');

  console.log('\n📌 2. Verificação dos Módulos Incorporados no Hub da Central Inteligente:');
  const hasMarketplaces = hubContent.includes("href: '/operacao'");
  const hasAnalytics = hubContent.includes("href: '/analytics'");
  const hasGrowth = hubContent.includes("href: '/growth'");
  const hasDiagnostics = hubContent.includes("href: '/diagnostico'");

  console.log('  • Módulo Central de Marketplaces (/operacao):', hasMarketplaces ? '✅ SIM' : '❌ NÃO');
  console.log('  • Módulo Inteligência Comercial (/analytics):', hasAnalytics ? '✅ SIM' : '❌ NÃO');
  console.log('  • Módulo Inteligência de Crescimento (/growth):', hasGrowth ? '✅ SIM' : '❌ NÃO');
  console.log('  • Módulo Central de Diagnóstico (/diagnostico):', hasDiagnostics ? '✅ SIM' : '❌ NÃO');

  if (!hasMarketplaces || !hasAnalytics || !hasGrowth || !hasDiagnostics) {
    throw new Error('❌ TESTE FALHOU: Nem todos os módulos avançados foram incorporados no Hub Central Inteligente.');
  }

  console.log('\n===========================================================');
  console.log('🎉 AUDITORIA DA CENTRAL INTELIGENTE CONCLUÍDA COM SUCESSO');
  console.log('===========================================================');
}

testCentralInteligenteHub();
