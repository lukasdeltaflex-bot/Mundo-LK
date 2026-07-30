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

async function verifyZeroMocksDirective() {
  console.log('===========================================================');
  console.log('📜 MUNDO LK — VALIDAÇÃO DA DIRETRIZ PERMANENTE: IA 100% REAL');
  console.log('===========================================================\n');

  console.log('📌 1. Verificação do Arquivo da Diretriz de Arquitetura:');
  const docPath = path.resolve(process.cwd(), 'DIRETRIZ_ARQUITETURA.md');
  const exists = fs.existsSync(docPath);
  console.log('  • Arquivo DIRETRIZ_ARQUITETURA.md Presente:', exists ? '✅ SIM' : '❌ NÃO');

  if (!exists) {
    throw new Error('❌ FALHA: DIRETRIZ_ARQUITETURA.md não foi encontrado no projeto.');
  }

  console.log('\n📌 2. Executando Auditoria da Central de Diagnóstico:');
  const diagService = SystemDiagnosticService.getInstance();
  const report = await diagService.runFullDiagnostic();

  const policyItem = report.items.find((i) => i.id === 'system_zero_mocks_policy');
  console.log('  • Item de Auditoria:', policyItem?.title);
  console.log('  • Status:', policyItem?.status === 'OK' ? '🟢 OK (100% Conforme)' : '🔴 ALERTA');
  console.log('  • Descrição:', policyItem?.description);

  if (policyItem?.status !== 'OK') {
    throw new Error('❌ FALHA: Central de Diagnóstico não validou a conformidade da política Zero Mocks!');
  }

  console.log('\n===========================================================');
  console.log('🎉 DIRETRIZ PERMANENTE CONSOLIDADA E VALIDADA COM SUCESSO');
  console.log('===========================================================');
}

verifyZeroMocksDirective();
