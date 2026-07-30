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

import { AffiliateSmartOrganizer } from '../src/core/domain/services/AffiliateSmartOrganizer';
import { AffiliateDistributionService } from '../src/core/application/services/AffiliateDistributionService';
import { AffiliateOffer } from '../src/core/domain/entities/affiliate-offer.entity';
import { AffiliateLink } from '../src/core/domain/value-objects/affiliate-link.vo';
import { Price } from '../src/core/domain/value-objects/price.vo';

async function runSmartOrganizationTest() {
  console.log('===========================================================');
  console.log('🤖 MUNDO LK — TESTE DE ORGANIZAÇÃO POR IA & TRAVA HUMANA');
  console.log('===========================================================\n');

  const organizer = AffiliateSmartOrganizer.getInstance();

  // 1. Etapa 1 — Análise Inicial por IA com Nível de Confiança
  console.log('📌 ETAPA 1 — Análise Inicial de Oferta pela IA (Gemini 2.5 Flash)');
  const initialOrg = await organizer.analyzeAndOrganize({
    title: 'Perfume Importado Sauvage Dior Eau de Parfum 100ml',
    price: 689.90,
    previousPrice: 899.00,
    url: 'https://produto.mercadolivre.com.br/MLB-112233-perfume-sauvage-dior',
  });

  console.log('  • Categoria Sugerida pela IA:', initialOrg.category);
  console.log('  • Subcategoria Sugerida:', initialOrg.subcategory);
  console.log('  • Nível de Confiança:', initialOrg.confidenceLevel, `(${initialOrg.confidenceScore}%)`);
  console.log('  • Status de Validação Humana:', initialOrg.isUserValidated);

  if (initialOrg.isUserValidated !== false) {
    throw new Error('❌ TESTE FALHOU: A sugestão inicial da IA não deve vir previamente validada.');
  }

  // 2. Etapa 2 — Correção Manual e Ativação da Trava Inegociável
  console.log('\n📌 ETAPA 2 — Correção Manual pelo Afiliado & Trava de Segurança');
  const validatedOrg = organizer.applyUserValidation(initialOrg, {
    category: 'Perfumaria de Luxo Masculina',
    subcategory: 'Fragrâncias Importadas',
    priority: 'ALTA',
  });

  console.log('  • Categoria Corrigida pelo Afiliado:', validatedOrg.category);
  console.log('  • Status da Trava de Segurança:', validatedOrg.isUserValidated ? '🔒 ATIVA (isUserValidated: true)' : 'ABERTA');
  console.log('  • Histórico de Versões:', validatedOrg.versionHistory.length, 'entradas registradas.');

  if (!validatedOrg.isUserValidated) {
    throw new Error('❌ TESTE FALHOU: A trava de segurança isUserValidated deveria ter sido ativada.');
  }

  // 3. Teste de Tentativa de Sobrescrita pela IA com Trava Ativa
  console.log('\n📌 ETAPA 3 — Verificação de Bloqueio contra Sobrescrita Automática da IA');
  const reanalyzedData = await organizer.analyzeAndOrganize({
    title: 'Perfume Importado Sauvage Dior Eau de Parfum 100ml',
    price: 689.90,
    previousPrice: 899.00,
    url: 'https://produto.mercadolivre.com.br/MLB-112233-perfume-sauvage-dior',
    existingData: validatedOrg,
  });

  console.log('  • Categoria após nova tentativa da IA:', reanalyzedData.category);

  if (reanalyzedData.category !== 'Perfumaria de Luxo Masculina') {
    throw new Error('❌ TESTE FALHOU: A IA alterou uma categoria validada manualmente pelo usuário!');
  }
  console.log('✅ [TRAVA HUMANA APROVADA] A decisão manual do afiliado foi 100% preservada perante a IA.');

  // 4. Teste de Reclassificação Sob Demanda pelo Usuário
  console.log('\n📌 ETAPA 4 — Reclassificação por IA Sob Demanda ("Reclassificar com IA")');
  const reclassifiedOrg = await organizer.reclassifyWithAI({
    title: 'Perfume Importado Sauvage Dior Eau de Parfum 100ml',
    price: 689.90,
    previousPrice: 899.00,
    url: 'https://produto.mercadolivre.com.br/MLB-112233-perfume-sauvage-dior',
    currentData: validatedOrg,
  });

  console.log('  • Categoria Reanalisada:', reclassifiedOrg.category);
  console.log('  • Total de Versões no Histórico:', reclassifiedOrg.versionHistory.length);

  console.log('\n===========================================================');
  console.log('🎉 AUDITORIA DE ORGANIZAÇÃO INTELIGENTE CONCLUÍDA COM SUCESSO');
  console.log('===========================================================');
}

runSmartOrganizationTest();
