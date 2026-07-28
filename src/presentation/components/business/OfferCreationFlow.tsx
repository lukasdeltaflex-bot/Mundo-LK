'use client';

import React, { useState, useCallback } from 'react';
import {
  Link as LinkIcon, Sparkles, Loader2, CheckCircle2,
  RefreshCcw, X, Copy, Check,
  Image as ImageIcon, ArrowRight,
  MessageCircle, Send, Brain, Target, Heart,
  TrendingUp, Zap, Crown, ShoppingCart, Minimize2, AlertCircle,
  History, Star, Layers, HelpCircle
} from 'lucide-react';
import { extractProductDetailsAction, analyzeProductUrlAction, type OfferPreview } from '@/presentation/actions/analyze-url.action';
import { saveApprovedOfferAction } from '@/presentation/actions/save-offer.action';
import { useAuth } from '@/presentation/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';
import type { OfferStyle } from '@/infrastructure/ai/providers/gemini.adapter';
import { ProductConfirmationModal } from './ProductConfirmationModal';
import { SmartDuplicationDetectorService } from '@/core/domain/services/smart-duplication-detector.service';
import { DuplicateProductModal } from './DuplicateProductModal';
import { Product } from '@/core/domain/entities/product.entity';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { Price } from '@/core/domain/value-objects';

interface StyleOption {
  id:       OfferStyle;
  label:    string;
  desc:     string;
  icon:     React.ElementType;
  color:    string;
  border:   string;
}

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'padrao',          label: 'Padrão',          desc: 'Equilibrado e persuasivo',      icon: Sparkles,    color: 'text-blue-400',   border: 'border-blue-500/40'   },
  { id: 'explosiva',       label: 'Explosiva',       desc: 'Bombástico e de alto impacto', icon: Zap,         color: 'text-orange-400', border: 'border-orange-500/40' },
  { id: 'premium',         label: 'Premium',         desc: 'Exclusivo e desejável',         icon: Crown,       color: 'text-purple-400', border: 'border-purple-500/40' },
  { id: 'urgencia',        label: 'Urgência',        desc: 'Escassez e estoque limitado',   icon: Zap,         color: 'text-amber-400',  border: 'border-amber-500/40'  },
  { id: 'minimalista',     label: 'Minimalista',     desc: 'Conciso e objetivo',            icon: Minimize2,   color: 'text-slate-300',  border: 'border-slate-500/40'  },
  { id: 'emocional',       label: 'Emocional',       desc: 'Transformação e bem-estar',     icon: Heart,       color: 'text-rose-400',   border: 'border-rose-500/40'   },
  { id: 'promocao',        label: 'Promoção',        desc: 'Foco no desconto e economia',   icon: TrendingUp,  color: 'text-emerald-400',border: 'border-emerald-500/40'},
  { id: 'custo_beneficio', label: 'Custo-Benefício', desc: 'Compra inteligente e valiosa',  icon: Target,      color: 'text-teal-400',   border: 'border-teal-500/40'   },
  { id: 'familia',         label: 'Família',         desc: 'Utilidade e lar acolhedor',     icon: Heart,       color: 'text-indigo-400', border: 'border-indigo-500/40' },
  { id: 'tecnologia',      label: 'Tecnologia',      desc: 'Inovação e alta performance',   icon: Brain,       color: 'text-cyan-400',   border: 'border-cyan-500/40'   },
  { id: 'casa',            label: 'Casa & Cozinha',  desc: 'Conforto e praticidade do lar', icon: Sparkles,    color: 'text-yellow-400', border: 'border-yellow-500/40' },
  { id: 'esporte',         label: 'Esporte',         desc: 'Treino, saúde e foco',          icon: Zap,         color: 'text-lime-400',   border: 'border-lime-500/40'   },
  { id: 'presentes',       label: 'Presentes',       desc: 'Ideal para presentear',         icon: Crown,       color: 'text-pink-400',   border: 'border-pink-500/40'   },
  { id: 'relampago',       label: 'Relâmpago',       desc: 'Acaba nos próximos minutos',   icon: Zap,         color: 'text-red-400',    border: 'border-red-500/40'    },
  { id: 'luxo',            label: 'Luxo',            desc: 'Sofisticação e alto padrão',    icon: Crown,       color: 'text-amber-300',  border: 'border-amber-400/40'  },
];

type FlowStep = 'input' | 'extracting' | 'duplicate_detected' | 'confirming' | 'analyzing' | 'preview' | 'saving' | 'done';

export interface OfferCreationFlowProps {
  onSaved?: (productId: string, offerId: string) => void;
}

export function OfferCreationFlow({ onSaved }: OfferCreationFlowProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [step,          setStep]          = useState<FlowStep>('input');
  const [url,           setUrl]           = useState('');
  const [tag,           setTag]           = useState('');
  const [style,         setStyle]         = useState<OfferStyle>('padrao');
  const [error,         setError]         = useState<string | null>(null);

  // Extracted Data & Confidence
  const [extractedData, setExtractedData] = useState<ProductExtractionResult | null>(null);
  const [confidence,    setConfidence]    = useState<number>(0);
  const [affiliateUrl,  setAffiliateUrl]  = useState<string>('');
  const [marketplace,   setMarketplace]   = useState<string>('');

  // Duplicate product detected state
  const [duplicateProduct, setDuplicateProduct] = useState<Product | null>(null);

  // Live Extraction Session Step Logs
  const [sessionSteps, setSessionSteps] = useState<string[]>([
    '🔗 Expandindo links e redirecionamentos...',
    '🏪 Identificando marketplace e plugin...',
    '🔑 Verificando duplicidade e cache L1/L2...',
    '🚀 Executando waterfall de extração profissional...',
  ]);

  // Preview & Version History
  const [preview,       setPreview]       = useState<OfferPreview | null>(null);
  const [versions,      setVersions]      = useState<OfferPreview[]>([]);
  const [activeVerIdx,  setActiveVerIdx]  = useState<number>(0);

  // Active channel copy view
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'story'>('whatsapp');
  const [copied,        setCopied]        = useState(false);

  // Editable overrides
  const [editTitle,     setEditTitle]     = useState('');
  const [editCta,       setEditCta]       = useState('');
  const [editWhatsapp,  setEditWhatsapp]  = useState('');

  const [savedIds, setSavedIds] = useState<{ productId: string; offerId: string } | null>(null);

  // Step 1: AI Generation from Confirmed Result
  const handleGenerateAI = useCallback(async (confirmed: ProductExtractionResult, overrideStyle?: OfferStyle) => {
    setError(null);
    setStep('analyzing');

    try {
      const result = await analyzeProductUrlAction({
        url:          url.trim(),
        affiliateTag: tag.trim() || 'mundolk',
        userId:       user?.uid,
        style:        overrideStyle ?? style,
        confirmedData: confirmed,
      });

      if (!result.success) {
        setError(result.error || 'Não conseguimos gerar a oferta agora.');
        setStep('confirming');
        return;
      }

      const newPreview = result.data;
      setPreview(newPreview);
      setVersions((prev) => [newPreview, ...prev]);
      setActiveVerIdx(0);

      setEditTitle(newPreview.product.title);
      setEditCta(newPreview.offer.cta);
      setEditWhatsapp(newPreview.offer.whatsAppText);
      setStyle(overrideStyle ?? style);
      setStep('preview');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro durante a geração da IA: ${msg}`);
      setStep('confirming');
    }
  }, [url, tag, user, style]);

  // Step 2: Extraction Waterfall Execution
  const handleStartExtraction = useCallback(async () => {
    const rawUrl = url.trim();
    if (!rawUrl) {
      setError('Cole a URL do produto para continuar.');
      return;
    }

    setError(null);
    setStep('extracting');
    setSessionSteps([
      '🔗 Expandindo link curto e redirecionamentos HTTP...',
      '🏪 Identificando marketplace oficial...',
      '🛡️ Checando duplicidades no seu catálogo...',
      '🚀 Executando waterfall multi-provider (Official API ➔ ZenRows ➔ Scraper)...',
    ]);

    try {
      const result = await extractProductDetailsAction({
        url: rawUrl,
        affiliateTag: tag.trim() || 'mundolk',
      });

      if (!result.success) {
        setError(result.error || 'Não foi possível acessar a página do produto.');
        setStep('input');
        return;
      }

      setExtractedData(result.data);
      setConfidence(result.confidenceScore);
      setAffiliateUrl(result.affiliateUrl);
      setMarketplace(result.marketplaceSlug);

      // Check Duplication Engine
      if (user?.uid) {
        const dupCheck = await SmartDuplicationDetectorService.checkForDuplicate(
          {
            url: rawUrl,
            title: result.data.title,
            image: result.data.image,
            marketplace: result.marketplaceSlug,
            currentPrice: result.data.currentPrice,
          },
          user.uid
        );

        if (dupCheck.isDuplicate && dupCheck.existingProduct) {
          setDuplicateProduct(dupCheck.existingProduct);
          setStep('duplicate_detected');
          return;
        }
      }

      if (result.requiresConfirmation) {
        setStep('confirming');
      } else {
        // High confidence (>=80%): auto-proceed directly to AI generation!
        handleGenerateAI(result.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro na extração de dados: ${msg}`);
      setStep('input');
    }
  }, [url, tag, user, handleGenerateAI]);

  // Handle Intelligent Update of Existing Duplicate Product
  const handleUpdateExistingProduct = useCallback(async () => {
    if (!duplicateProduct || !extractedData) return;

    try {
      const newPriceAmount = extractedData.currentPrice || 0;
      const oldPriceAmount = duplicateProduct.currentPrice?.amount || 0;

      // Update price and details
      duplicateProduct.updatePrice(Price.create(newPriceAmount));
      if (extractedData.image) {
        if (!duplicateProduct.images) duplicateProduct.images = [];
        if (!duplicateProduct.images.includes(extractedData.image)) {
          duplicateProduct.images.unshift(extractedData.image);
        }
      }

      // Add audit log to dispatch history
      duplicateProduct.recordDispatch({
        channel: 'Sistema Interno',
        targetGroup: 'Atualização de Preço',
        sentBy: user?.name || user?.email || 'Admin',
        type: 'MANUAL',
        notes: `[ATUALIZAÇÃO INTELIGENTE DE OFERTA] Preço atualizado de R$ ${oldPriceAmount.toFixed(2)} para R$ ${newPriceAmount.toFixed(2)}.`,
      });

      const repo = new FirestoreProductRepository();
      await repo.save(duplicateProduct);

      // Proceed to generate AI offer with fresh prices
      handleGenerateAI(extractedData);
    } catch (err) {
      console.error('Erro ao atualizar oferta existente:', err);
      handleGenerateAI(extractedData);
    }
  }, [duplicateProduct, extractedData, user, handleGenerateAI]);

  // Regenerate / Generate alternative style
  const handleGenerateAlternative = useCallback((newStyle?: OfferStyle) => {
    if (!extractedData) return;
    const selectedStyle = newStyle ?? style;
    setStyle(selectedStyle);
    handleGenerateAI(extractedData, selectedStyle);
  }, [extractedData, style, handleGenerateAI]);

  // Switch version tab
  const handleSelectVersion = (idx: number) => {
    const target = versions[idx];
    if (!target) return;
    setActiveVerIdx(idx);
    setPreview(target);
    setEditTitle(target.product.title);
    setEditCta(target.offer.cta);
    setEditWhatsapp(target.offer.whatsAppText);
  };

  // Copy to clipboard
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save Approved Offer
  const handleApprove = useCallback(async () => {
    if (!preview || !user) return;
    setStep('saving');
    setError(null);

    try {
      const result = await saveApprovedOfferAction({
        preview,
        userId:      user.uid,
        editedTitle: editTitle !== preview.product.title ? editTitle : undefined,
        editedCta:   editCta   !== preview.offer.cta    ? editCta   : undefined,
      });

      if (!result.success) {
        setError(result.error || 'Falha ao salvar a oferta.');
        setStep('preview');
        return;
      }

      setSavedIds({ productId: result.productId, offerId: result.offerId });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setStep('done');
      onSaved?.(result.productId, result.offerId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Erro ao salvar a oferta: ${msg}`);
      setStep('preview');
    }
  }, [preview, user, editTitle, editCta, queryClient, onSaved]);

  const handleReset = () => {
    setStep('input');
    setUrl('');
    setTag('');
    setError(null);
    setPreview(null);
    setVersions([]);
    setExtractedData(null);
    setDuplicateProduct(null);
    setSavedIds(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* ── ERROR ALERT ── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">Atenção:</span> {error}
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── STEP 1: INPUT ── */}
      {step === 'input' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Assistente de Ofertas Enterprise</h2>
              <p className="text-xs text-slate-400">Extração real multi-provider com checagem de duplicidade e IA persuasiva.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Link do Produto (Shopee, Mercado Livre, Amazon, Magalu)</label>
              <div className="mt-2 flex rounded-xl border border-slate-700 bg-slate-950 shadow-inner focus-within:border-blue-500">
                <span className="flex items-center pl-3 text-slate-500">
                  <LinkIcon className="h-5 w-5" />
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://shopee.com.br/product/... ou https://mercadolivre.com.br/..."
                  className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Tag de Afiliado (Opcional)</label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="mundolk"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Estilo de Copy Inicial</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as OfferStyle)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  {STYLE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label} — {opt.desc}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleStartExtraction}
              disabled={!url.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 active:scale-98 disabled:pointer-events-none disabled:opacity-50"
            >
              <Sparkles className="h-5 w-5" />
              <span>Analisar Produto e Extrair Dados Reais</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEPPER EXTRACTION SESSION PROGRESS ── */}
      {(step === 'extracting' || step === 'analyzing') && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/90 p-10 text-center shadow-2xl space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-2" />
          <h3 className="text-lg font-bold text-white">
            {step === 'extracting' ? '🔎 Processando Pipeline de Extração Enterprise...' : '🤖 Geração de Oferta Persuasiva com IA...'}
          </h3>

          <div className="w-full max-w-md rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2 text-left text-xs font-mono">
            {sessionSteps.map((logItem, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{logItem}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DUPLICATE PRODUCT DETECTED MODAL ── */}
      {step === 'duplicate_detected' && duplicateProduct && (
        <DuplicateProductModal
          existingProduct={duplicateProduct}
          onUpdateExisting={handleUpdateExistingProduct}
          onForceCreateNew={() => {
            if (extractedData) handleGenerateAI(extractedData);
          }}
          onCancel={() => setStep('input')}
        />
      )}

      {/* ── PRE-AI PRODUCT CONFIRMATION MODAL (<80% CONFIDENCE) ── */}
      {step === 'confirming' && extractedData && (
        <ProductConfirmationModal
          data={{ ...extractedData, confidenceScore: confidence } as any}
          marketplaceSlug={marketplace}
          affiliateUrl={affiliateUrl}
          onConfirm={(confirmed) => handleGenerateAI(confirmed)}
          onCancel={() => setStep('input')}
        />
      )}

      {/* ── PREVIEW SCREEN ── */}
      {step === 'preview' && preview && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Oferta Gerada com Sucesso
                </span>
                {versions.length > 1 && (
                  <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 border border-purple-500/20 flex items-center gap-1">
                    <History className="h-3.5 w-3.5" /> {versions.length} Versões Disponíveis
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-lg font-bold text-white">{preview.product.title}</h2>
              <p className="text-xs text-slate-400">Preço: <span className="font-semibold text-emerald-400">{preview.product.price}</span> | Desconto: {preview.product.discountPercent}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleGenerateAlternative()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                <RefreshCcw className="h-4 w-4" />
                <span>Gerar Outra Oferta</span>
              </button>

              <button
                onClick={handleApprove}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Aprovar e Salvar Oferta</span>
              </button>
            </div>
          </div>

          {/* Version History Tabs */}
          {versions.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1 shrink-0">
                <Layers className="h-3.5 w-3.5" /> Histórico:
              </span>
              {versions.map((ver, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectVersion(idx)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${activeVerIdx === idx ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  Versão {versions.length - idx} ({ver.offer.style})
                </button>
              ))}
            </div>
          )}

          {/* Main Grid: Live Mockup Card & Copy Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Live Social Post Mockup Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-blue-400" /> Prévia Visual do Post
                  </span>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
                    Estilo: {preview.offer.style}
                  </span>
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-inner space-y-3">
                  {preview.product.imageUrl && (
                    <img src={preview.product.imageUrl} alt="Produto" className="h-48 w-full object-contain rounded-lg bg-slate-900 p-2" />
                  )}

                  <div className="space-y-1">
                    <span className="inline-block rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                      🔥 SUPER OFERTA DE AFILIADO
                    </span>
                    <h4 className="text-sm font-bold text-white leading-snug">{editTitle}</h4>
                  </div>

                  <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-emerald-400">{preview.product.price}</span>
                      {preview.product.previousPrice && (
                        <span className="text-xs text-slate-500 line-through">{preview.product.previousPrice}</span>
                      )}
                      <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                        {preview.product.discountPercent}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-600 p-2.5 text-center text-xs font-bold text-white shadow-md flex items-center justify-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span>{editCta}</span>
                  </div>
                </div>
              </div>

              {/* Commercial Intelligence & Star Score */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Brain className="h-4 w-4 text-purple-400" /> Inteligência Comercial
                  </span>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400" />
                    <span className="text-xs font-extrabold">{preview.offer.score}/100</span>
                  </div>
                </div>

                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-200 space-y-1">
                  <span className="font-bold block">💡 Diagnóstico do Consultor IA:</span>
                  <p>{preview.offer.justification}</p>
                </div>
              </div>
            </div>

            {/* Right: Social Copy Inspector */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
                  <button
                    onClick={() => setActiveChannel('whatsapp')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeChannel === 'whatsapp' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </button>
                  <button
                    onClick={() => setActiveChannel('telegram')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeChannel === 'telegram' ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <Send className="h-3.5 w-3.5" /> Telegram
                  </button>
                  <button
                    onClick={() => setActiveChannel('instagram')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeChannel === 'instagram' ? 'bg-pink-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <Heart className="h-3.5 w-3.5" /> Instagram
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">Copy Formatada para {activeChannel.toUpperCase()}</label>
                    <button
                      onClick={() => handleCopyText(editWhatsapp)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-white leading-relaxed focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-medium text-slate-400">Título Editável</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-400">Chamada para Ação (CTA)</label>
                    <input
                      type="text"
                      value={editCta}
                      onChange={(e) => setEditCta(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Alternate Style Selector */}
                <div className="border-t border-slate-800 pt-3">
                  <span className="text-xs font-semibold text-slate-300 block mb-2">Alternar Estilo de Copy:</span>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleGenerateAlternative(opt.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${style === opt.id ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP DONE ── */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-12 text-center shadow-2xl">
          <CheckCircle2 className="h-16 w-16 text-emerald-400 mb-4 animate-bounce" />
          <h3 className="text-2xl font-extrabold text-white">Oferta Salva com Sucesso!</h3>
          <p className="mt-2 text-sm text-slate-300 max-w-md">A oferta foi registrada no seu banco de dados Firestore e está pronta para divulgação.</p>
          <button
            onClick={handleReset}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-blue-500"
          >
            <Sparkles className="h-4 w-4" />
            <span>Criar Nova Oferta</span>
          </button>
        </div>
      )}
    </div>
  );
}
