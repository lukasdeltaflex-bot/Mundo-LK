import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Script da Etapa 2 — Baseline Inicial (Fase 0)
 * Calcula as métricas estáticas do sistema antes das refatorações da Release 2.2.9.
 */
function runBaseline() {
  const rootDir = process.cwd();
  const dateStr = new Date().toISOString().split('T')[0];
  const auditDir = path.join(rootDir, 'system_audits');

  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }

  console.log('[ETAPA 2] Calculando Baseline Inicial do Sistema...');

  let tsErrorCount = 0;
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: rootDir });
  } catch (err: any) {
    const output = err.stdout ? err.stdout.toString() : '';
    const matches = output.match(/error TS/g);
    tsErrorCount = matches ? matches.length : 1;
  }

  // Scan codebase for mock keywords
  let mockCount = 0;
  let mathRandomCount = 0;
  let setTimeoutCount = 0;
  let todoCount = 0;

  const srcDir = path.join(rootDir, 'src');
  const scanFiles = (dir: string) => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanFiles(fullPath);
      } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (/mock|fake|dummy|simulate/i.test(content)) mockCount++;
        if (/Math\.random/i.test(content)) mathRandomCount++;
        if (/setTimeout/i.test(content)) setTimeoutCount++;
        if (/TODO|FIXME/i.test(content)) todoCount++;
      }
    }
  };

  scanFiles(srcDir);

  const baseline = {
    release: '2.2.9',
    timestamp: new Date().toISOString(),
    typescriptErrors: tsErrorCount,
    filesWithMocks: mockCount,
    filesWithMathRandom: mathRandomCount,
    filesWithSetTimeout: setTimeoutCount,
    filesWithTodos: todoCount,
    status: tsErrorCount === 0 ? 'CLEAN_TYPESCRIPT' : 'TYPESCRIPT_ERRORS_DETECTED',
  };

  const outputFile = path.join(auditDir, `baseline_${dateStr}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(baseline, null, 2), 'utf-8');
  console.log(`[ETAPA 2] Baseline gerado em: ${outputFile}`);
  console.log(`Erros TypeScript: ${tsErrorCount} | Mocks: ${mockCount} | Math.random: ${mathRandomCount} | setTimeout: ${setTimeoutCount} | TODOs: ${todoCount}`);
}

runBaseline();
