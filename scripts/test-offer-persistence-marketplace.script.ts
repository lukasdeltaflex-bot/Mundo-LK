/**
 * Teste de Validação da Persistência de Ofertas e Inteligência de Marketplace (Fase 2.5)
 * Testes:
 * 1. Mapeamento bidirecional no OfferMapper com marketplaceId, marketplaceName e marketplaceDetectedBy.
 * 2. Validação de hard fail no FirestoreOfferRepository caso auth.currentUser seja nulo (prevenção de dados órfãos).
 * 3. Integridade do contrato OfferPreview com versaoConversao, versaoPremium e versaoSocial.
 */

import { Offer, MarketplaceDetectionSource } from '../src/core/domain/entities/offer.entity';
import { OfferMapper, FirestoreOfferDoc } from '../src/infrastructure/firebase/mappers/offer.mapper';
import { ChannelContent } from '../src/core/domain/value-objects/channel-content.vo';
import { FirestoreOfferRepository } from '../src/infrastructure/firebase/repositories/firestore-offer.repository';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FALHOU: ${label}`);
    failed++;
  }
}

async function run() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🧪 TESTE DE PERSISTÊNCIA DE OFERTAS & MARKETPLACE (FASE 2.5)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // ─── TESTE 1: Entidade e Mapper — Marketplace Fields ─────────────────────────
  console.log('📌 [1/3] Testando Mapeamento da Entidade Offer & OfferMapper...');

  const copies = ChannelContent.create({
    whatsAppText: '🔥 Oferta imperdível no WhatsApp',
    telegramText: '⚡ Oferta no Telegram',
    instagramText: '✨ Oferta no Instagram',
  });

  const offerOriginal = new Offer({
    id: 'off_test_123',
    productId: 'prod_test_456',
    userId: 'user_test_789',
    scoreValue: 95,
    scoreLabel: 'EXCELLENT',
    scoreJustification: 'Excelente pontuação',
    copies,
    hashtags: ['#promo', '#shopee'],
    emojis: ['🔥', '⚡'],
    cta: 'Compre Agora',
    aiProviderUsed: 'gemini-2.5-flash',
    createdAt: new Date(),
    marketplaceId: 'shopee',
    marketplaceName: 'Shopee',
    marketplaceDetectedBy: 'url_parser',
  });

  const docPersistence = OfferMapper.toPersistence(offerOriginal);
  assert(docPersistence.marketplaceId === 'shopee', 'Doc Firestore contém marketplaceId = "shopee"');
  assert(docPersistence.marketplaceName === 'Shopee', 'Doc Firestore contém marketplaceName = "Shopee"');
  assert(docPersistence.marketplaceDetectedBy === 'url_parser', 'Doc Firestore contém marketplaceDetectedBy = "url_parser"');

  const offerRestored = OfferMapper.toDomain(docPersistence);
  assert(offerRestored.marketplaceId === 'shopee', 'Entidade restaurada preserva marketplaceId');
  assert(offerRestored.marketplaceName === 'Shopee', 'Entidade restaurada preserva marketplaceName');
  assert(offerRestored.marketplaceDetectedBy === 'url_parser', 'Entidade restaurada preserva marketplaceDetectedBy');
  console.log('');

  // ─── TESTE 2: Hard Fail no Repository para Usuário Não Autenticado ──────────
  console.log('📌 [2/3] Testando Hard Fail no FirestoreOfferRepository...');
  const repo = new FirestoreOfferRepository();

  let throwOccurred = false;
  try {
    // Sem auth.currentUser ativo em ambiente node puro, deve lançar erro explícito
    await repo.save(offerOriginal);
  } catch (err: any) {
    throwOccurred = true;
    assert(
      err.message.includes('Usuário não autenticado'),
      'Repository lança exceção clara ao tentar salvar sem auth.currentUser'
    );
  }
  assert(throwOccurred, 'Hard fail evitou gravação de dado órfão sem credenciais ativas');
  console.log('');

  // ─── TESTE 3: Retrocompatibilidade com Docs Sem Marketplace ─────────────────
  console.log('📌 [3/3] Testando Retrocompatibilidade com Documentos Antigos...');

  const docAntigo: FirestoreOfferDoc = {
    id: 'off_legacy_001',
    productId: 'prod_legacy_002',
    userId: 'user_legacy_003',
    scoreValue: 80,
    scoreLabel: 'GOOD',
    scoreJustification: 'Doc legado',
    copies: { whatsAppText: 'Copy antiga' },
    hashtags: [],
    emojis: [],
    cta: 'Ver mais',
    aiProviderUsed: 'gemini-2.5-flash',
    createdAt: new Date().toISOString(),
  };

  const offerLegada = OfferMapper.toDomain(docAntigo);
  assert(offerLegada.id === 'off_legacy_001', 'Id do doc legado mantido');
  assert(offerLegada.copies.copies.whatsAppText === 'Copy antiga', 'Copy do doc legado carregada');
  assert(offerLegada.marketplaceDetectedBy === 'url_parser', 'Fallback de marketplaceDetectedBy atribuído ("url_parser")');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════════');
  if (failed === 0) {
    console.log(`🎉 TESTES DE PERSISTÊNCIA & MARKETPLACE APROVADOS! (${passed}/${passed + failed})`);
  } else {
    console.log(`⚠️ RESULTADO: ${passed} passaram, ${failed} falharam.`);
  }
  console.log('═══════════════════════════════════════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('❌ ERRO NO SCRIPT DE TESTE:', err);
  process.exit(1);
});
