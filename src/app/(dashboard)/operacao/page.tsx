'use client';

import React, { useState, useEffect } from 'react';
import {
  PlugZap, Sparkles, Layers, History, ShieldCheck, Key,
  HeartPulse, Server, Activity, ArrowRight, Share2
} from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { Product } from '@/core/domain/entities/product.entity';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';
import {
  MarketplaceIntegrationManagerService,
  MarketplaceIntegrationState,
  DiagnosticTestResult,
  SystemCredentialDiagnostic,
} from '@/core/domain/services/marketplace-integration-manager.service';
import { SocialShareData } from '@/presentation/components/business/SocialShareModal';

// ── Sub-componentes Modulares da Central de Marketplaces ───────────────────────
import { IntegrationStatus } from './components/IntegrationStatus';
import { ProductImporter, ImportMode } from './components/ProductImporter';
import { ProductReviewModal } from './components/ProductReviewModal';
import { AIEnginePanel } from './components/AIEnginePanel';
import { MediaStudioPanel } from './components/MediaStudioPanel';
import { PublishPanelModal } from './components/PublishPanelModal';
import { OfferHistoryTable } from './components/OfferHistoryTable';
import { CredentialManagerModal } from './components/CredentialManagerModal';

export default function AffiliateOperationsHubPage() {
  const { user } = useAuth();

  // Estados de Integrações
  const [integrations, setIntegrations] = useState<MarketplaceIntegrationState[]>(() =>
    MarketplaceIntegrationManagerService.getMarketplacesStatus()
  );
  const [diagnostics] = useState<SystemCredentialDiagnostic[]>(() =>
    MarketplaceIntegrationManagerService.getSystemCredentialsDiagnostic()
  );

  // Estados dos Produtos / Histórico
  const [products, setProducts] = useState<Product[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [testingSlug, setTestingSlug] = useState<string | null>(null);

  // Modais e Painéis
  const [reviewData, setReviewData] = useState<{ data: ProductExtractionResult; slug: string } | null>(null);
  const [shareModalData, setShareModalData] = useState<SocialShareData | null>(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);

  // Carregar histórico de produtos do Firestore
  const loadProducts = async () => {
    if (!user?.uid) return;
    try {
      const repo = new FirestoreProductRepository();
      const list = await repo.findAll(user.uid);
      setProducts(list);
    } catch (err) {
      console.warn('[Hub] Erro ao carregar histórico:', err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  // Ações do Hub
  const handleTestConnection = async (slug: string) => {
    setTestingSlug(slug);
    try {
      await MarketplaceIntegrationManagerService.testConnection(slug);
    } catch (err) {
      console.error('[Hub] Erro ao testar conexão:', err);
    } finally {
      setTestingSlug(null);
    }
  };

  const handleImportProduct = async (input: string, mode: ImportMode) => {
    setIsImporting(true);
    try {
      // Simula a resolução do pipeline de extração
      await new Promise((res) => setTimeout(res, 1200));

      // Dispara a tela de conferência manual para revisão antes de salvar
      const preview: ProductExtractionResult = {
        title: mode === 'url' ? 'Produto Importado do Marketplace' : `Produto (${input.toUpperCase()})`,
        description: 'Descrição original do produto importado via pipeline inteligente.',
        currentPrice: 99.9,
        originalPrice: 149.9,
        discountPercentage: 33,
        currency: 'BRL',
        brand: 'Oficial',
        category: 'Geral',
        subcategory: 'Geral',
        marketplace: 'Shopee',
        sellerName: 'Loja Verificada',
        sellerRating: 4.8,
        shippingType: 'Frete Grátis',
        shippingPrice: 0,
        freeShipping: true,
        prime: false,
        full: false,
        mall: true,
        coupon: '',
        cashback: '',
        installments: '',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
        gallery: [],
        rating: 4.8,
        reviewCount: 120,
        soldQuantity: '500+',
        productId: 'shopee_preview_1',
        canonicalUrl: input,
        originalUrl: input,
      };

      setReviewData({ data: preview, slug: 'shopee' });
    } catch (err) {
      console.error('[Hub] Erro na importação:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmReview = (confirmed: ProductExtractionResult) => {
    setReviewData(null);
    // Abre o painel de publicação imediata pós-salvamento
    setShareModalData({
      title: confirmed.title,
      price: confirmed.currentPrice ? `R$ ${confirmed.currentPrice.toFixed(2)}` : 'R$ 99,90',
      previousPrice: confirmed.originalPrice ? `R$ ${confirmed.originalPrice.toFixed(2)}` : undefined,
      imageUrl: confirmed.image,
      affiliateUrl: 'https://mundolk.com/oferta/preview',
      whatsAppText: `🔥 *${confirmed.title}*\nPor apenas R$ ${confirmed.currentPrice?.toFixed(2)}!\n🛒 Confira: https://mundolk.com/oferta/preview`,
      telegramText: `📢 *${confirmed.title}*\nEconomia garantida!\n👉 https://mundolk.com/oferta/preview`,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* ── HEADER COM IDENTIDADE PRÓPRIA DO AFFILIATE OPERATIONS HUB ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 text-white">
            <PlugZap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Affiliate Operations Hub
              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                Enterprise v4.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Centro operacional unificado de importação, enriquecimento com IA, geração de mídias e distribuição.
            </p>
          </div>
        </div>
      </div>

      {/* ── MÓDULO 1: STATUS DAS INTEGRAÇÕES (TOPO) ── */}
      <IntegrationStatus
        integrations={integrations}
        onTestConnection={handleTestConnection}
        onOpenCredentials={() => setShowCredentialModal(true)}
        testingSlug={testingSlug}
      />

      {/* ── MÓDULO 2: MOTOR UNIVERSAL DE IMPORTAÇÃO (CORAÇÃO DA TELA) ── */}
      <ProductImporter onImport={handleImportProduct} isLoading={isImporting} />

      {/* ── MÓDULOS 3 & 4: IA & MEDIA STUDIO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIEnginePanel
          onGenerateAI={async (style) => {
            alert(`Gerando ofertas persuasivas no estilo "${style.toUpperCase()}" com o motor Gemini 2.5 Flash...`);
          }}
        />

        <MediaStudioPanel
          productTitle="Fone de Ouvido Bluetooth Pro"
          productImage="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
        />
      </div>

      {/* ── MÓDULO 5: HISTÓRICO OPERACIONAL DO AFILIADO ── */}
      <OfferHistoryTable
        products={products}
        onShareProduct={(p) => {
          setShareModalData({
            title: p.title,
            price: p.currentPrice ? p.currentPrice.formatBRL() : 'R$ 0,00',
            imageUrl: p.images[0],
            affiliateUrl: p.affiliateUrl ? p.affiliateUrl.url : p.originalUrl,
            whatsAppText: `🔥 *${p.title}*\nLink: ${p.originalUrl}`,
          });
        }}
      />

      {/* ── MODAIS E PAINÉIS FLUTUANTES ── */}
      {reviewData && (
        <ProductReviewModal
          data={reviewData.data}
          marketplaceSlug={reviewData.slug}
          onConfirm={handleConfirmReview}
          onCancel={() => setReviewData(null)}
        />
      )}

      {shareModalData && (
        <PublishPanelModal data={shareModalData} onClose={() => setShareModalData(null)} />
      )}

      {showCredentialModal && (
        <CredentialManagerModal onClose={() => setShowCredentialModal(false)} />
      )}
    </div>
  );
}
