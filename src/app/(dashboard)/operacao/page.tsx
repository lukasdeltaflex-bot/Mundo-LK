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
import { ImportEngine, ResolutionStepLog } from './services/ImportEngine';
import { AIService } from './services/AIService';
import { MediaService, MediaItem } from './services/MediaService';
import { PublishingService } from './services/PublishingService';

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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, DiagnosticTestResult>>({});

  // Estados do Pipeline de Importação
  const [resolutionLogs, setResolutionLogs] = useState<ResolutionStepLog[]>([]);
  const [sourceProvider, setSourceProvider] = useState<string | null>(null);
  const [generatedMedia, setGeneratedMedia] = useState<MediaItem[]>([]);

  // Modais e Painéis
  const [reviewData, setReviewData] = useState<{
    data: ProductExtractionResult;
    slug: string;
    reviewReason?: string;
  } | null>(null);
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
      const res = await MarketplaceIntegrationManagerService.testConnection(slug);
      setTestResults((prev) => ({ ...prev, [slug]: res }));
    } catch (err) {
      console.error('[Hub] Erro ao testar conexão:', err);
    } finally {
      setTestingSlug(null);
    }
  };

  const handleImportProduct = async (input: string, mode: ImportMode) => {
    setIsImporting(true);
    setAiNotice(null);
    try {
      const engine = new ImportEngine();
      const result = await engine.resolveProduct(input, mode);

      setResolutionLogs(result.logs);
      setSourceProvider(result.sourceProvider);

      setReviewData({
        data: result.data,
        slug: result.marketplaceSlug,
        reviewReason: result.reviewReason,
      });
    } catch (err) {
      console.error('[Hub] Erro na importação:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenerateAI = async (style: string) => {
    if (!reviewData?.data) {
      alert('Importe ou selecione um produto antes de acionar o enriquecimento por IA.');
      return;
    }
    setIsGeneratingAI(true);
    setAiNotice(null);
    try {
      const aiService = new AIService();
      const res = await aiService.generateEnrichment(reviewData.data, style, user?.uid || 'user_default');

      if (!res.success) {
        setAiNotice(res.error || 'Falha ao acionar IA.');
        return;
      }

      // Gera mídias vinculadas à Offer
      const mediaService = new MediaService();
      const mediaList = mediaService.generateMediaForOffer(
        res.offerProps?.productId || `offer_${Date.now()}`,
        reviewData.data.title,
        reviewData.data.image,
        reviewData.data.currentPrice
      );
      setGeneratedMedia(mediaList);

      alert(`🟢 Anúncio enriquecido com sucesso usando ${res.providerUsed}! Mídias geradas.`);
    } catch (err) {
      console.error('[Hub] Erro na IA:', err);
      setAiNotice('Ocorreu um erro ao processar os modelos de IA.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleConfirmReview = async (confirmed: ProductExtractionResult) => {
    setReviewData(null);
    const userId = user?.uid || 'user_default';

    try {
      const aiService = new AIService();
      const aiResult = await aiService.generateEnrichment(confirmed, 'padrao', userId);

      const pubService = new PublishingService();
      const saved = await pubService.saveProductAndOffer(
        confirmed,
        aiResult.offerProps || {},
        userId
      );

      // Recarrega o histórico do Firestore
      await loadProducts();

      // Dispara automaticamente o painel pós-salvar em 1 clique
      const channelCopies = saved.offer.copies.copies;
      setShareModalData({
        title: saved.product.title,
        price: saved.product.currentPrice ? saved.product.currentPrice.formatBRL() : 'R$ 0,00',
        imageUrl: saved.product.images[0],
        affiliateUrl: saved.product.affiliateUrl.url,
        whatsAppText: channelCopies.whatsAppText || `🔥 *${saved.product.title}*\nLink: ${saved.product.affiliateUrl.url}`,
        telegramText: channelCopies.telegramText || `📢 *${saved.product.title}*\nLink: ${saved.product.affiliateUrl.url}`,
      });
    } catch (err) {
      console.error('[Hub] Erro ao salvar produto e oferta no Firestore:', err);
    }
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
        testResults={testResults}
      />

      {/* ── MÓDULO 2: MOTOR UNIVERSAL DE IMPORTAÇÃO (CORAÇÃO DA TELA) ── */}
      <ProductImporter
        onImport={handleImportProduct}
        isLoading={isImporting}
        resolutionLogs={resolutionLogs}
        sourceProvider={sourceProvider}
      />

      {/* ── AVISO DE ERRO DE CREDENCIAL DE IA ── */}
      {aiNotice && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <div className="font-bold">Aviso do Motor de IA:</div>
          <div>{aiNotice}</div>
        </div>
      )}

      {/* ── MÓDULOS 3 & 4: IA & MEDIA STUDIO ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIEnginePanel
          onGenerateAI={handleGenerateAI}
          isGenerating={isGeneratingAI}
        />

        <MediaStudioPanel
          productTitle={reviewData?.data.title || (products[0]?.title ?? 'Produto Importado')}
          productImage={reviewData?.data.image || (products[0]?.images[0] ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500')}
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
        onEditProduct={(p) => {
          setReviewData({
            data: {
              title: p.title,
              description: p.description,
              currentPrice: p.currentPrice ? p.currentPrice.amount : 0,
              originalPrice: p.previousPrice ? p.previousPrice.amount : null,
              discountPercentage: p.discountPercentage ? p.discountPercentage.value : 0,
              currency: 'BRL',
              brand: p.brand,
              category: p.categoryId,
              subcategory: 'Geral',
              marketplace: p.marketplaceSlug.toUpperCase(),
              sellerName: '',
              sellerRating: 5,
              shippingType: 'Frete Grátis',
              shippingPrice: 0,
              freeShipping: true,
              prime: false,
              full: false,
              mall: false,
              coupon: '',
              cashback: '',
              installments: '',
              image: p.images[0] || '',
              gallery: p.images,
              rating: 5,
              reviewCount: 100,
              soldQuantity: '100+',
              productId: p.id,
              canonicalUrl: p.affiliateUrl ? p.affiliateUrl.url : p.originalUrl,
              originalUrl: p.originalUrl,
            },
            slug: p.marketplaceSlug,
          });
        }}
        onDuplicateProduct={(p) => {
          alert(`Oferta "${p.title}" duplicada para nova campanha.`);
        }}
        onArchiveProduct={async (p) => {
          if (confirm(`Deseja arquivar a oferta "${p.title}"?`)) {
            try {
              const repo = new FirestoreProductRepository();
              p.status = 'ARCHIVED';
              await repo.save(p);
              await loadProducts();
            } catch (err) {
              console.error('Erro ao arquivar oferta:', err);
            }
          }
        }}
        onDeleteProduct={async (p) => {
          if (confirm(`Deseja remover permanentemente a oferta "${p.title}"?`)) {
            try {
              const repo = new FirestoreProductRepository();
              await repo.delete(p.id);
              await loadProducts();
            } catch (err) {
              console.error('Erro ao excluir oferta:', err);
            }
          }
        }}
      />

      {/* ── MODAIS E PAINÉIS FLUTUANTES ── */}
      {reviewData && (
        <ProductReviewModal
          data={reviewData.data}
          marketplaceSlug={reviewData.slug}
          reviewReason={reviewData.reviewReason}
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
