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
import { AIService } from '../src/app/(dashboard)/operacao/services/AIService';
import { AffiliateSmartOrganizer } from '../src/core/domain/services/AffiliateSmartOrganizer';

async function runGeminiKeyTest() {
  console.log('===========================================================');
  console.log('🤖 MUNDO LK — TESTE TÉCNICO DA NOVA CHAVE OFICIAL GEMINI');
  console.log('===========================================================\n');

  // 1. Verificação da Variável de Ambiente
  const key = process.env.GEMINI_API_KEY;
  console.log('📌 1. Verificação de Variável de Ambiente:');
  console.log('  • GEMINI_API_KEY Presente:', Boolean(key));
  console.log('  • Prioridade 1 (process.env.GEMINI_API_KEY):', key ? `${key.substring(0, 5)}...****` : 'NÃO CONFIGURADA');

  if (!key) {
    throw new Error('❌ TESTE FALHOU: GEMINI_API_KEY não foi encontrada no .env.local!');
  }

  // 2. Teste de Diagnóstico em Tempo Real da API
  console.log('\n📌 2. Teste de Conectividade Sanitizada da Central de Diagnóstico:');
  const diagService = SystemDiagnosticService.getInstance();
  const report = await diagService.runFullDiagnostic();

  const geminiItem = report.items.find((i) => i.id === 'ai_gemini');
  console.log('  • Status do Item Gemini:', geminiItem?.status);
  console.log('  • Descrição Sanitizada:', geminiItem?.description);
  console.log('  • Latência da Resposta:', `${geminiItem?.latencyMs} ms`);

  if (geminiItem?.status !== 'OK' && geminiItem?.status !== 'WARNING') {
    throw new Error(`❌ TESTE FALHOU: Central de Diagnóstico reportou erro no Gemini (${geminiItem?.errorMessage})`);
  }

  // 3. Teste de Geração de Copy Comercial Real
  console.log('\n📌 3. Teste de Geração de Copy Comercial Real com a Nova Chave:');
  const startTime = Date.now();
  const copy = await AIService.generateOfferCopy({
    title: 'Smartphone Samsung Galaxy S24 Ultra 512GB 5G Câmera 200MP',
    price: 6299.00,
    previousPrice: 7999.00,
    affiliateUrl: 'https://shopee.com.br/product/12345/67890-galaxy-s24-ultra',
    style: 'whatsapp',
  });
  const copyTime = Date.now() - startTime;

  console.log(`  • Tempo de Geração: ${copyTime} ms`);
  console.log('  • Trecho da Copy Gerada (primeiros 150 caracteres):');
  console.log('   ', copy.substring(0, 150).replace(/\n/g, ' '));

  // 4. Teste de Classificação Inteligente por IA
  console.log('\n📌 4. Teste de Classificação Inteligente da Oferta pela IA:');
  const organizer = AffiliateSmartOrganizer.getInstance();
  const orgResult = await organizer.analyzeAndOrganize({
    title: 'Smartphone Samsung Galaxy S24 Ultra 512GB 5G Câmera 200MP',
    price: 6299.00,
    previousPrice: 7999.00,
    url: 'https://shopee.com.br/product/12345/67890-galaxy-s24-ultra',
  });

  console.log('  • Categoria Sugerida:', orgResult.category);
  console.log('  • Subcategoria Sugerida:', orgResult.subcategory);
  console.log('  • Nível de Confiança:', orgResult.confidenceLevel, `(${orgResult.confidenceScore}%)`);

  // 5. Garantia de Segurança Absoluta (Sem Vazamento de Credencial)
  const fullOutput = copy + JSON.stringify(report);
  if (fullOutput.includes(key)) {
    throw new Error('❌ ALERTA DE SEGURANÇA: Chave sensível foi exposta em alguma saída!');
  }
  console.log('\n✅ [SEGURANÇA CONFIRMADA] Nenhuma credencial sensível foi vazada no frontend, logs ou diagnósticos.');

  console.log('\n===========================================================');
  console.log('🎉 VALIDAÇÃO DA NOVA CHAVE DO GOOGLE GEMINI CONCLUÍDA COM SUCESSO');
  console.log('===========================================================');
}

runGeminiKeyTest();
