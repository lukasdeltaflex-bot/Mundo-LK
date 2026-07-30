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

import { AIContextBuilder } from '../src/infrastructure/ai/services/AIContextBuilder';

async function runAIContextBuilderVerification() {
  console.log('===========================================================');
  console.log('🧪 MUNDO LK — TESTE DO AICONTEXTBUILDER (CAMADA INTERMEDIÁRIA DESACOPLADA)');
  console.log('===========================================================\n');

  const builder = new AIContextBuilder();

  console.log(`📌 Verificando contextVersion: ${AIContextBuilder.CONTEXT_VERSION}`);
  if (AIContextBuilder.CONTEXT_VERSION !== 1) {
    throw new Error('❌ CONTEXT_VERSION incorreta!');
  }

  const promptBlock = builder.buildConsolidatedPromptContext({
    userPrefs: {
      userId: 'usr_test',
      strategyVersion: 1,
      confidenceScore: 90,
      updatedAt: new Date().toISOString(),
      preferEmojiDensity: 'baixa',
      preferLength: 'conciso',
      avoidCliches: true,
      tonePreference: 'direto',
      customKeywords: [],
    },
    winningStrategiesPrompt: '• Estratégia Top 1\n• Estratégia Top 2\n• Estratégia Top 3',
    marketplaceMem: {
      marketplaceSlug: 'shopee',
      strategyVersion: 1,
      confidenceScore: 95,
      updatedAt: new Date().toISOString(),
      copyLengthStyle: 'curto',
      emojiUsage: 'abundante',
      urgencyLevel: 'alta',
      focusPillars: ['Preço Baixo'],
    },
    categoryMem: {
      categoryId: 'Perfumaria',
      strategyVersion: 1,
      confidenceScore: 85,
      updatedAt: new Date().toISOString(),
      keyVocabulary: ['Fixação', 'Projeção'],
      primaryPainPoint: 'Durabilidade do aroma',
      conversionTriggers: ['Desconto Real'],
    },
    diversityScore: 45, // < 60 -> Deve ativar diretriz anti-overfitting
  });

  console.log('--- BLOCO DE CONTEXTO MONTAGEM DESACOPLADA ---');
  console.log(promptBlock);
  console.log('---------------------------------------------\n');

  if (!promptBlock.includes('[META INFO: contextVersion=1]')) {
    throw new Error('❌ Meta info contextVersion=1 não foi incluída!');
  }

  if (!promptBlock.includes('DIRETRIZ ANTI-OVERFITTING')) {
    throw new Error('❌ Diretriz anti-overfitting não foi ativada!');
  }

  console.log('===========================================================');
  console.log('🎉 TESTE DO AICONTEXTBUILDER CONCLUÍDO COM SUCESSO');
  console.log('===========================================================');
  process.exit(0);
}

runAIContextBuilderVerification().catch((err) => {
  console.error('❌ ERRO NO TESTE DO AICONTEXTBUILDER:', err.message);
  process.exit(1);
});
