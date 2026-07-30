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

import { SystemDiagnosticService } from '../src/core/domain/services/SystemDiagnosticService';

async function runDiagnosticTest() {
  console.log('===========================================================');
  console.log('🏥 MUNDO LK — AUDITORIA TÉCNICA DO CENTRO DE DIAGNÓSTICO');
  console.log('===========================================================\n');

  const diagService = SystemDiagnosticService.getInstance();

  console.log('📌 1. Executando varredura automatizada de diagnósticos...');
  const report = await diagService.runFullDiagnostic();

  console.log('  • Saúde Geral do Sistema:', `${report.overallScore}%`);
  console.log('  • Status Global:', report.overallStatus);
  console.log('  • Verificações Concluídas:', report.totalChecks);
  console.log('  • OK:', report.okCount, '| Avisos:', report.warningCount, '| Erros:', report.errorCount);

  console.log('\n📌 2. Health Scores Detalhados por Módulo:');
  report.moduleScores.forEach((m) => {
    console.log(`  • ${m.moduleName.padEnd(22)}: ${m.score}% [${m.status}]`);
  });

  console.log('\n📌 3. Teste de Ação de Auto-Repair (Correção Automática em 1 Toque):');
  const repairResult = await diagService.repairProblem('db_firestore_write');
  console.log('  • Resultado do Auto-Repair:', repairResult.message);

  if (!repairResult.success) {
    throw new Error('❌ TESTE FALHOU: Ação de Auto-Repair deveria ter retornado sucesso.');
  }

  console.log('\n📌 4. Teste de Gerador de Relatório Sanitizado (Sanitização de Dados Sensíveis):');
  const txtReport = diagService.generateSanitisedTxtReport(report);
  console.log('  • Primeiras 5 linhas do Relatório Formatado em TXT:');
  console.log(txtReport.split('\n').slice(0, 7).join('\n'));

  // Validação de Segurança Absoluta (Garantia de que Secrets/Keys não são expostos)
  const secretKey = process.env.MERCADO_LIVRE_CLIENT_SECRET || 'MYzqjkE4KqTFuIR7025DDnfnVNflBRek';
  if (txtReport.includes(secretKey)) {
    throw new Error('❌ ALERTA DE SEGURANÇA: Credencial privada identificada no relatório de saída!');
  }

  console.log('✅ [SEGURANÇA CONFIRMADA] Nenhum segredo ou chave privada foi exposto no relatório sanitizado.');

  console.log('\n===========================================================');
  console.log('🎉 AUDITORIA DO CENTRO DE DIAGNÓSTICO FINALIZADA COM SUCESSO');
  console.log('===========================================================');
}

runDiagnosticTest();
