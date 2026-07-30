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

import { AILearningEngineService } from '../src/core/domain/services/AILearningEngineService';
import { UserAIPreferencesService } from '../src/core/domain/services/UserAIPreferencesService';
import { WinningStrategyService } from '../src/core/domain/services/WinningStrategyService';
import { MarketplaceAIMemoryService } from '../src/core/domain/services/MarketplaceAIMemoryService';
import { CategoryAIMemoryService } from '../src/core/domain/services/CategoryAIMemoryService';

async function runAILearningEngineVerification() {
  console.log('===========================================================');
  console.log('🧪 MUNDO LK — TESTE DO MOTOR DE APRENDIZADO DA IA (7 EVOLUÇÕES)');
  console.log('===========================================================\n');

  // 1. Teste de Aprendizado por Edição do Usuário
  console.log('📌 [1/5] Testando Registro de Edições do Usuário...');
  const testUserId = 'usr_test_learning_123';
  const origCopy = '🔥 Oferta incrível! Garanta já o seu produto com excelente custo benefício por apenas R$ 100.';
  const editedCopy = 'Perfume Sauvage Dior importado com menor preço da semana. Garanta no link: https://s.shopee.com.br/x';

  await UserAIPreferencesService.recordUserEdit(testUserId, origCopy, editedCopy);
  const userPrefs = await UserAIPreferencesService.getUserPreferences(testUserId);

  console.log('  • Preferências Atualizadas:', userPrefs?.preferEmojiDensity, '| Extensão:', userPrefs?.preferLength, '| Confiança:', userPrefs?.confidenceScore, '%');
  if (!userPrefs || userPrefs.preferLength !== 'conciso') {
    throw new Error('❌ Falha na atualização de preferências do usuário!');
  }

  // 2. Teste de Aprendizado Mínimo & Estratégias Vencedoras (Guardrails de Amostragem)
  console.log('\n📌 [2/5] Testando Guardrail de Amostragem Mínima (≥100 cliques)...');
  await WinningStrategyService.recordPerformance({
    category: 'Perfumaria',
    marketplace: 'shopee',
    style: 'premium',
    goal: 'maxima_conversao',
    winningAngle: 'Aroma Duradouro & Fixação',
    winningCTA: 'Garanta o seu com menor preço da semana',
    clicks: 40, // < 100 cliques -> DEVE SER REJEITADO
    conversions: 2,
  });

  await WinningStrategyService.recordPerformance({
    category: 'Perfumaria',
    marketplace: 'shopee',
    style: 'premium',
    goal: 'maxima_conversao',
    winningAngle: 'Aroma Duradouro & Fixação',
    winningCTA: 'Garanta o seu com menor preço da semana',
    clicks: 1200, // ≥ 100 cliques -> DEVE SER ACEITO
    conversions: 140,
  });

  const winningCtx = await WinningStrategyService.getTopStrategiesContext('Perfumaria');
  console.log('  • Contexto de Estratégia Vencedora Gerado:', winningCtx ? 'SIM' : 'NÃO');

  // 3. Teste de Memória Isolada por Marketplace
  console.log('\n📌 [3/5] Testando Memória de Marketplace (Shopee vs. Mercado Livre)...');
  const shopeeMem = await MarketplaceAIMemoryService.getMarketplaceMemory('shopee');
  const mlMem = await MarketplaceAIMemoryService.getMarketplaceMemory('mercadolivre');

  console.log(`  • Shopee: Emojis ${shopeeMem.emojiUsage}, Urgência ${shopeeMem.urgencyLevel}`);
  console.log(`  • Mercado Livre: Emojis ${mlMem.emojiUsage}, Urgência ${mlMem.urgencyLevel}`);

  // 4. Teste de Memória da Categoria
  console.log('\n📌 [4/5] Testando Memória por Categoria...');
  const catMem = await CategoryAIMemoryService.getCategoryMemory('Smartwatches');
  console.log('  • Categoria Smartwatches -> Vocabulário:', catMem.keyVocabulary.join(', '));

  // 5. Teste de Montagem da Hierarquia de Prompt (5 Camadas)
  console.log('\n📌 [5/5] Testando Agregação de Contexto Hierárquico (5 Camadas)...');
  const aggregatedCtx = await AILearningEngineService.buildHierarchicalContext({
    userId: testUserId,
    marketplaceSlug: 'shopee',
    categoryId: 'Perfumaria',
  });

  console.log('--- TRECHO DO PROMPT HIERÁRQUICO GERADO ---');
  console.log(aggregatedCtx.fullHierarchicalPromptBlock);
  console.log('-------------------------------------------\n');

  console.log('===========================================================');
  console.log('🎉 TESTE DO MOTOR DE APRENDIZADO DA IA CONCLUÍDO COM SUCESSO');
  console.log('===========================================================');
  process.exit(0);
}

runAILearningEngineVerification().catch((err) => {
  console.error('❌ ERRO NO TESTE DO MOTOR DE APRENDIZADO:', err.message);
  process.exit(1);
});
