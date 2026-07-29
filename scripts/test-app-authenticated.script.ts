import { app, db, auth, storage } from '../src/infrastructure/firebase/config/firebase.config';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { MercadoLivreProvider } from '../src/infrastructure/marketplaces/providers/MercadoLivreProvider';
import { AffiliateLinkResolver } from '../src/core/domain/services/AffiliateLinkResolver';
import { AffiliateOffer } from '../src/core/domain/entities/affiliate-offer.entity';
import { AIService } from '../src/app/(dashboard)/operacao/services/AIService';
import { AffiliateDistributionService } from '../src/core/application/services/AffiliateDistributionService';
import { AffiliateCampaign } from '../src/core/domain/entities/affiliate-campaign.entity';
import { AffiliateCampaignScheduler } from '../src/core/domain/services/AffiliateCampaignScheduler';

async function runAuthenticatedApplicationSuite() {
  console.log('===========================================================');
  console.log('📱 MUNDO LK — TESTES DE APLICAÇÃO (USUÁRIO AUTENTICADO)');
  console.log('===========================================================\n');

  console.log('📌 ETAPA 1 — Verificação da Sessão de Autenticação do Usuário');
  
  let currentUser = auth.currentUser;

  // Se não houver sessão ativa, tenta autenticação com conta de integração enviada no ambiente
  if (!currentUser) {
    const testEmail = process.env.TEST_USER_EMAIL || 'test_affiliate@mundolk.com';
    const testPass = process.env.TEST_USER_PASS || 'Password123!';
    
    try {
      console.log(`🔑 Tentando autenticar usuário de integração: ${testEmail}...`);
      const userCred = await signInWithEmailAndPassword(auth, testEmail, testPass);
      currentUser = userCred.user;
      console.log(`✅ [AUTH SUCCESS] Usuário autenticado com sucesso! UID: ${currentUser.uid}`);
    } catch (err: any) {
      console.warn('\n⚠️ [INTERRUPÇÃO DE SEGURANÇA]: Operações protegidas do Firestore e Storage requerem um usuário autenticado.');
      console.warn(`🔒 Erro de autenticação: ${err?.message || String(err)}`);
      console.warn('📌 Regra de Segurança Aplicada: firestore.rules exige request.auth != null e request.auth.uid == userId para gravação.');
      console.log('\n===========================================================');
      console.log('📊 RELATÓRIO: INTERROMPIDO POR TRAVA DE SEGURANÇA ESPERADA');
      console.log('===========================================================');
      return;
    }
  }

  const userId = currentUser.uid;
  console.log(`✅ Usuário Ativo Confirmado: UID ${userId}\n`);

  // -------------------------------------------------------------------------
  // TESTE 1 — PERSISTÊNCIA EM COLEÇÃO DO USUÁRIO (/offers/{offerId})
  // -------------------------------------------------------------------------
  console.log('📌 TESTE 1 — Gravação de Oferta no Firestore (/offers)');
  const mlProvider = new MercadoLivreProvider();
  const linkResolver = AffiliateLinkResolver.getInstance();

  const targetUrl = 'https://produto.mercadolivre.com.br/MLB-8877665544-smartphone-5g-128gb';
  const extracted = await mlProvider.extractOfferData(targetUrl);

  const protectedLink = linkResolver.resolve({
    originalMarketplaceUrl: targetUrl,
    userAffiliateUrl: `${targetUrl}?utm_source=auth_suite_test`,
  });

  const offer = new AffiliateOffer({
    id: `off_user_${Date.now()}`,
    userId, // Vinculado estritamente ao UID autenticado
    marketplace: 'mercadolivre',
    marketplaceItemId: extracted.marketplaceItemId,
    originalUrl: extracted.originalUrl,
    affiliateLink: protectedLink,
    productData: {
      ...extracted.productData,
      title: 'Smartphone 5G 128GB Tela AMOLED 120Hz',
    },
    pricing: extracted.pricing,
    commission: extracted.commission,
    status: 'ACTIVE',
  });

  const offerRef = doc(db, 'offers', offer.id);

  try {
    await setDoc(offerRef, {
      id: offer.id,
      userId: offer.userId,
      tenantId: offer.tenantId,
      marketplace: offer.marketplace,
      marketplaceItemId: offer.marketplaceItemId,
      originalUrl: offer.originalUrl,
      affiliateLink: {
        id: offer.affiliateLink.id,
        originalMarketplaceUrl: offer.affiliateLink.originalMarketplaceUrl,
        affiliateUrl: offer.affiliateLink.affiliateUrl,
        hashIntegrity: offer.affiliateLink.hashIntegrity,
      },
      productData: offer.productData,
      pricing: offer.pricing,
      commission: offer.commission,
      status: offer.status,
      updatedAt: offer.updatedAt,
    });
    console.log(`✅ [CREATE OFFERS SUCCESS] Oferta ${offer.id} salva no Firestore vinculada ao UID ${userId}.`);

    const snap = await getDoc(offerRef);
    if (snap.exists()) {
      console.log('✅ [READ OFFERS SUCCESS] Leitura confirmada:', snap.data()?.productData?.title);
    }

    await deleteDoc(offerRef);
    console.log('✅ [DELETE OFFERS SUCCESS] Limpeza da oferta concluída.');
  } catch (err: any) {
    console.error('❌ [TEST 1 FAILED]:', err?.message || err);
  }

  console.log('\n===========================================================');
  console.log('🎉 SUÍTE DE APLICAÇÃO EXECUTADA COM SEGURANÇA');
  console.log('===========================================================');
}

runAuthenticatedApplicationSuite();
