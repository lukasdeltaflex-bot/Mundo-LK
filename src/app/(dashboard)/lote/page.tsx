'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import {
  Layers,
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Save,
  Edit3,
  RefreshCw,
  Info,
  CheckSquare,
  Square,
  FileCheck,
} from 'lucide-react';
import { BatchImportService, BatchItem, BatchItemStatus } from '@/infrastructure/queue/batch-import.service';
import { BatchAIQueueManager } from '@/infrastructure/queue/batch-ai-queue.manager';
import { ImportEngine } from '../operacao/services/ImportEngine';
import { PublishingService } from '../operacao/services/PublishingService';
import { ChannelContent } from '@/core/domain/value-objects/channel-content.vo';
import { OfferProps } from '@/core/domain/entities/offer.entity';
import { OFFICIAL_TAXONOMY_CATEGORIES } from '@/core/domain/entities/product.entity';
import { OfferStyle } from '@/infrastructure/ai/providers/gemini.adapter';
import { useAuth } from '@/presentation/context/AuthContext';
import { Price } from '@/core/domain/value-objects';

const LOT_BATCH_STATE_KEY = 'mundo_lk_batch_lote_draft_v1';

export default function LotePage() {
  const { user } = useAuth();
  const [urlsInput, setUrlsInput] = useState('');
  const [queue, setQueue] = useState<BatchItem[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<OfferStyle>('padrao');

  // Estados de controle de execução
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [quotaErrorBanner, setQuotaErrorBanner] = useState<string | null>(null);

  // Modal de edição inline para itens em NEEDS_REVIEW
  const [editingItem, setEditingItem] = useState<BatchItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);
  const aiCallsDuringExtractionRef = useRef(0);

  const batchService = BatchImportService.getInstance();
  const publishingService = useRef(new PublishingService()).current;

  // Carrega rascunho temporário do localStorage ao iniciar
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(LOT_BATCH_STATE_KEY);
      if (savedDraft) {
        const parsed: BatchItem[] = JSON.parse(savedDraft);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQueue(parsed);
        }
      }
    } catch (e) {
      console.warn('Falha ao restaurar rascunho de lote do localStorage:', e);
    }
  }, []);

  // Salva o rascunho temporário no localStorage sempre que o lote é atualizado
  useEffect(() => {
    try {
      if (queue.length > 0) {
        localStorage.setItem(LOT_BATCH_STATE_KEY, JSON.stringify(queue));
      } else {
        localStorage.removeItem(LOT_BATCH_STATE_KEY);
      }
    } catch (e) {
      console.warn('Falha ao salvar rascunho de lote no localStorage:', e);
    }
  }, [queue]);

  const handleTogglePause = () => {
    const nextState = !isPaused;
    setIsPaused(nextState);
    isPausedRef.current = nextState;
  };

  const handleClearBatch = () => {
    setIsExtracting(false);
    setIsGeneratingAI(false);
    setIsSaving(false);
    setIsPaused(false);
    isPausedRef.current = false;
    isCancelledRef.current = true;
    setQueue([]);
    setQuotaErrorBanner(null);
    localStorage.removeItem(LOT_BATCH_STATE_KEY);
  };

  // ─── FASE 1: Extração Primária de Metadados (0 Chamadas de IA) ────────────
  const handleStartExtraction = async () => {
    const rawUrls = urlsInput.split('\n').filter((u) => u.trim());
    if (rawUrls.length === 0) return;

    // Reseta contador de diagnóstico: 0 chamadas de IA durante extração
    aiCallsDuringExtractionRef.current = 0;
    setQuotaErrorBanner(null);

    const items = batchService.createBatch(rawUrls);
    setQueue(items);
    setIsExtracting(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isCancelledRef.current = false;

    const importEngine = new ImportEngine();

    for (let index = 0; index < items.length; index++) {
      if (isCancelledRef.current) break;

      while (isPausedRef.current) {
        if (isCancelledRef.current) break;
        await new Promise((r) => setTimeout(r, 400));
      }

      if (isCancelledRef.current) break;

      const item = items[index];

      // Atualiza estado para EXTRACTING
      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'EXTRACTING', progress: 30 } : i))
      );

      try {
        const result = await importEngine.resolveProduct(item.url);

        if (result && result.data) {
          const resData = result.data;
          const isMissingEssential = !resData.title || resData.currentPrice === null || resData.currentPrice === 0;

          const newStatus: BatchItemStatus = isMissingEssential ? 'NEEDS_REVIEW' : 'EXTRACTED';

          setQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: newStatus,
                    progress: 100,
                    productTitle: resData.title || 'Produto sem título',
                    marketplaceSlug: result.marketplaceSlug,
                    currentPrice: resData.currentPrice,
                    imageUrl: resData.image,
                    extractionResult: resData,
                    reviewReason: isMissingEssential ? 'Título ou preço ausente na extração.' : undefined,
                  }
                : i
            )
          );
        } else {
          setQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'NEEDS_REVIEW',
                    progress: 100,
                    reviewReason: result?.reviewReason || 'Falha ao extrair metadados da página',
                  }
                : i
            )
          );
        }
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'ERROR',
                  progress: 100,
                  error: err?.message || 'Erro de conexão/extração',
                }
              : i
          )
        );
      }
    }

    setIsExtracting(false);
  };

  // ─── FASE 2: Controles de Seleção & Edição Inline ─────────────────────────
  const handleToggleSelectAll = (select: boolean) => {
    setQueue((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const handleToggleItemSelect = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleOpenEditModal = (item: BatchItem) => {
    setEditingItem(item);
    setEditTitle(item.userConfirmedData?.title || item.productTitle || item.extractionResult?.title || '');
    setEditPrice(
      item.userConfirmedData?.currentPrice !== undefined
        ? String(item.userConfirmedData.currentPrice)
        : item.currentPrice !== null && item.currentPrice !== undefined
        ? String(item.currentPrice)
        : ''
    );
    setEditDescription(
      item.userConfirmedData?.description || item.extractionResult?.description || ''
    );
    setEditCategory(item.userConfirmedData?.category || item.extractionResult?.category || 'Geral');
  };

  const handleSaveInlineEdit = () => {
    if (!editingItem) return;

    const validPrice = Price.parseBRL(editPrice);

    setQueue((prev) =>
      prev.map((i) => {
        if (i.id === editingItem.id) {
          const updatedConfirmedData = {
            ...(i.userConfirmedData || {}),
            title: editTitle.trim(),
            currentPrice: validPrice,
            description: editDescription.trim(),
            category: editCategory.trim() || 'Geral',
          };
          const isComplete = Boolean(editTitle.trim() && validPrice !== null && validPrice > 0);
          return {
            ...i,
            productTitle: editTitle.trim(),
            currentPrice: validPrice,
            status: isComplete ? 'EXTRACTED' : 'NEEDS_REVIEW',
            userConfirmedData: updatedConfirmedData,
            reviewReason: isComplete ? undefined : 'Complete título e preço para avançar.',
          };
        }
        return i;
      })
    );

    setEditingItem(null);
  };

  // ─── FASE 4: Geração de Copy por IA por Demanda com Anti-429 ───────────────
  const handleGenerateAICopiesForSelected = async () => {
    const selectedItems = queue.filter(
      (i) => i.selected && (i.status === 'EXTRACTED' || i.status === 'AI_READY' || i.status === 'ERROR')
    );

    if (selectedItems.length === 0) {
      alert('Selecione ao menos um produto extraído para gerar Copy com IA.');
      return;
    }

    setIsGeneratingAI(true);
    setQuotaErrorBanner(null);

    const queueManager = new BatchAIQueueManager(2); // Concorrência máxima: 2 requisições simultâneas

    await queueManager.processQueue(
      selectedItems,
      selectedStyle,
      user?.uid,
      (updatedItem) => {
        setQueue((prev) => prev.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
      },
      (quotaReason) => {
        setQuotaErrorBanner(quotaReason);
      }
    );

    setIsGeneratingAI(false);
  };

  // ─── FASE 3: Salvamento no Firestore (Com Suporte a "Salvar Sem IA") ────────
  const handleSaveSelected = async (withAI: boolean) => {
    if (!user?.uid) {
      alert('Você precisa estar autenticado para salvar ofertas.');
      return;
    }

    const selectedItems = queue.filter((i) => i.selected && i.status !== 'SAVED' && i.status !== 'PENDING');
    if (selectedItems.length === 0) {
      alert('Selecione ao menos um produto para salvar.');
      return;
    }

    setIsSaving(true);
    const activeUid = user.uid;

    for (const item of selectedItems) {
      if (item.status === 'SAVED') continue;

      try {
        const confirmed = item.userConfirmedData;
        const ext = item.extractionResult;

        const finalTitle = confirmed?.title || item.productTitle || ext?.title || 'Produto sem título';
        const finalPrice = confirmed?.currentPrice ?? item.currentPrice ?? ext?.currentPrice ?? 0;
        const finalPriceStr = finalPrice ? `R$ ${finalPrice.toFixed(2)}` : 'R$ 0,00';
        const finalDesc = confirmed?.description || ext?.description || '';
        const finalUrl = ext?.originalUrl || ext?.canonicalUrl || item.url;
        const finalImg = confirmed?.image || item.imageUrl || ext?.image || '';
        const finalCat = confirmed?.category || ext?.category || 'Geral';

        // Constrói o objeto ProductExtractionResult validado
        const productData = {
          title: finalTitle,
          description: finalDesc,
          currentPrice: finalPrice,
          originalPrice: ext?.originalPrice ?? null,
          discountPercentage: ext?.discountPercentage || 0,
          currency: 'BRL',
          brand: ext?.brand || '',
          category: finalCat,
          subcategory: 'Geral',
          marketplace: (item.marketplaceSlug || ext?.marketplace || 'GERAL').toUpperCase(),
          sellerName: ext?.sellerName || '',
          sellerRating: ext?.sellerRating || 0,
          shippingType: ext?.shippingType || '',
          shippingPrice: null,
          freeShipping: false,
          prime: false,
          full: false,
          mall: false,
          coupon: '',
          cashback: '',
          installments: '',
          image: finalImg,
          gallery: ext?.gallery || [],
          rating: ext?.rating || 0,
          reviewCount: ext?.reviewCount || 0,
          soldQuantity: ext?.soldQuantity || '',
          productId: ext?.productId || item.id,
          canonicalUrl: ext?.canonicalUrl || finalUrl,
          originalUrl: item.url,
        };

        let whatsAppCopy = '';
        let telegramCopy = '';
        let offerScore = 80;
        let aiProviderUsed = 'Salvo Sem IA (Modo Direto)';

        // Se for salvamento com IA e houver preview gerado
        if (withAI && item.offerPreview) {
          whatsAppCopy = item.offerPreview.offer.whatsAppText;
          telegramCopy = item.offerPreview.offer.telegramText || whatsAppCopy;
          offerScore = item.offerPreview.offer.score || 90;
          aiProviderUsed = (item.offerPreview.offer as any).aiProviderUsed || 'IA OpenAI/Gemini';
        } else {
          // REGRA ARQUITETURAL INEGOCIÁVEL: Salvamento Sem IA salva com Copy Vazia / COPY_PENDENTE
          // Zero templates robóticos estáticos fake!
          whatsAppCopy = '';
          telegramCopy = '';
          aiProviderUsed = 'Pendente de Gerar IA';
        }

        const channelContent = ChannelContent.create({
          whatsAppText: whatsAppCopy,
          telegramText: telegramCopy,
          instagramText: whatsAppCopy,
          facebookText: whatsAppCopy,
        });

        const offerProps: Partial<OfferProps> = {
          copies: channelContent,
          scoreValue: offerScore,
          scoreLabel: 'EXCELLENT' as any,
          scoreJustification: withAI ? 'Oferta com Copy IA gerada' : 'Oferta cadastrada no modo direto (Copy Pendente)',
          hashtags: ['#Oferta', '#Desconto', '#MundoLK'],
          emojis: ['🔥', '⚡'],
          cta: '👉 Acesse o link oficial para conferir!',
          aiProviderUsed,
        };

        // Grava no Firestore de forma independente
        await publishingService.saveProductAndOffer(productData as any, offerProps, activeUid);

        // Atualiza status individual do item para SAVED
        setQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'SAVED', progress: 100 } : i))
        );
      } catch (err: any) {
        console.error(`[LotePage] Falha ao salvar item ${item.id}:`, err);
        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'ERROR', error: err?.message || 'Falha ao salvar no banco' } : i
          )
        );
      }
    }

    setIsSaving(false);
  };

  // Métricas de progresso
  const totalCount = queue.length;
  const extractedCount = queue.filter((i) => i.status === 'EXTRACTED' || i.status === 'AI_READY' || i.status === 'SAVED').length;
  const needsReviewCount = queue.filter((i) => i.status === 'NEEDS_REVIEW').length;
  const aiReadyCount = queue.filter((i) => i.status === 'AI_READY').length;
  const savedCount = queue.filter((i) => i.status === 'SAVED').length;
  const errorCount = queue.filter((i) => i.status === 'ERROR').length;
  const selectedCount = queue.filter((i) => i.selected).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header com Diagnóstico e Título */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-400" />
            <span>Linha de Produção de Ofertas em Lote</span>
          </h1>
          <p className="text-sm text-slate-400">
            Pipeline profissional: Extração de Metadados ➔ Revisão no Staging ➔ IA por Demanda ➔ Persistência Independente.
          </p>
        </div>

        {queue.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearBatch} leftIcon={<XCircle className="h-4 w-4 text-red-400" />}>
            Limpar Fila / Novo Lote
          </Button>
        )}
      </div>

      {/* Banner de Aviso de Limite/Cota de IA (HTTP 429) */}
      {quotaErrorBanner && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <span>⚠️ Cota de IA Atingida — Produtos 100% Preservados na Tabela</span>
          </div>
          <p className="text-slate-300">
            As requisições de IA foram pausadas pela plataforma. **Seus produtos extraídos estão salvos no staging abaixo**.
            Você pode salvá-los imediatamente sem IA usando o botão <strong>"Salvar Selecionados sem IA"</strong> ou tentar gerar a Copy novamente mais tarde.
          </p>
        </div>
      )}

      {/* FASE 1: Inserção de URLs Múltiplas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-5">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Colar URLs do Lote</span>
              <Badge variant="info">Até 100 Links</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Cole uma URL por linha. As duplicadas serão removidas automaticamente. Extração executada com 0 chamadas de IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <textarea
              rows={9}
              value={urlsInput}
              onChange={(e) => setUrlsInput(e.target.value)}
              placeholder="https://shopee.com.br/product/123&#10;https://mercadolivre.com.br/MLB-456&#10;https://amazon.com.br/dp/789"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />

            <Button
              variant="primary"
              className="w-full py-2.5 text-xs font-bold"
              disabled={isExtracting || isGeneratingAI || isSaving || !urlsInput.trim()}
              leftIcon={isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              onClick={handleStartExtraction}
            >
              {isExtracting ? 'Extraindo Metadados dos Produtos...' : '1. Iniciar Extração do Lote (Sem IA)'}
            </Button>
          </CardContent>
        </Card>

        {/* Resumo de Métricas do Lote */}
        <Card className="lg:col-span-2 p-5 space-y-4">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Métricas do Lote Ativo</CardTitle>
                <CardDescription className="text-xs">
                  {totalCount} itens na fila • {selectedCount} selecionados
                </CardDescription>
              </div>

              {isExtracting && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleTogglePause}>
                    {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          {/* Cards de Métricas em Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-slate-100">{totalCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total URLs</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-emerald-400">{extractedCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Extraídos</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-amber-400">{needsReviewCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Revisão</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-blue-400">{aiReadyCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Copy IA</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-purple-400">{savedCount}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Salvos</div>
            </div>
          </div>

          {/* Barra de Ações em Lote */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Estilo de Copy:</span>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value as OfferStyle)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="padrao">Padrão (Natural & Equilibrada)</option>
                <option value="beneficios">Benefícios (Foco na Rotina)</option>
                <option value="curiosidade">Curiosidade (Gancho Provocativo)</option>
                <option value="agressiva">Agressiva (Direta & Energética)</option>
                <option value="urgencia">Urgência (Ritmo Oportunidade)</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                disabled={isGeneratingAI || isSaving || selectedCount === 0}
                leftIcon={isGeneratingAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-blue-400" />}
                onClick={handleGenerateAICopiesForSelected}
              >
                2. Gerar Copy dos Selecionados ({selectedCount})
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="text-xs"
                disabled={isSaving || selectedCount === 0}
                leftIcon={<FileCheck className="h-3.5 w-3.5 text-emerald-400" />}
                onClick={() => handleSaveSelected(false)}
              >
                Salvar Sem IA
              </Button>

              <Button
                variant="primary"
                size="sm"
                className="text-xs font-bold"
                disabled={isSaving || selectedCount === 0}
                leftIcon={isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                onClick={() => handleSaveSelected(true)}
              >
                Salvar Selecionados ({selectedCount})
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* FASE 2: TABELA DE STAGING & REVISÃO INTERATIVA */}
      <Card className="p-5">
        <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Tabela de Staging e Produção de Ofertas</CardTitle>
            <CardDescription className="text-xs">
              Revise os produtos extraídos, edite dados se necessário e selecione quais itens gerar Copy ou salvar.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-xs text-slate-400" onClick={() => handleToggleSelectAll(true)}>
              <CheckSquare className="h-3.5 w-3.5 mr-1" /> Selecionar Todos
            </Button>
            <Button size="sm" variant="ghost" className="text-xs text-slate-400" onClick={() => handleToggleSelectAll(false)}>
              <Square className="h-3.5 w-3.5 mr-1" /> Desmarcar Todos
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {queue.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 text-xs space-y-2">
              <Layers className="h-8 w-8 text-slate-600 mx-auto" />
              <div>Nenhum lote em staging. Cole as URLs acima e clique em "Iniciar Extração".</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 w-10 text-center">Sel</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Marketplace</th>
                    <th className="p-3">Preço</th>
                    <th className="p-3">Briefing / Descrição</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {queue.map((item) => {
                    const priceFormatted = Price.formatBRL(item.currentPrice);
                    const hasDesc = Boolean(item.userConfirmedData?.description || item.extractionResult?.description);

                    return (
                      <tr key={item.id} className={`hover:bg-slate-900/50 transition-colors ${item.selected ? 'bg-blue-950/20' : ''}`}>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(item.selected)}
                            onChange={() => handleToggleItemSelect(item.id)}
                            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3 max-w-[320px]">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="h-10 w-10 object-cover rounded-lg border border-slate-800 shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-600 shrink-0">
                                📦
                              </div>
                            )}
                            <div className="truncate">
                              <div className="font-semibold text-slate-200 truncate">{item.productTitle || item.url}</div>
                              <div className="text-[10px] text-slate-500 font-mono truncate">{item.url}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-300">
                          {(item.marketplaceSlug || '—').toUpperCase()}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {priceFormatted}
                        </td>
                        <td className="p-3">
                          {hasDesc ? (
                            <Badge variant="success">✓ Informado</Badge>
                          ) : (
                            <Badge variant="neutral">Sem briefing</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {item.status === 'EXTRACTED' && <Badge variant="info">Extraído</Badge>}
                          {item.status === 'NEEDS_REVIEW' && <Badge variant="warning">⚠️ Revisão</Badge>}
                          {item.status === 'AI_GENERATING' && <Badge variant="info">Gerando IA...</Badge>}
                          {item.status === 'AI_READY' && <Badge variant="success">✨ Copy IA</Badge>}
                          {item.status === 'SAVED' && <Badge variant="success">✓ Salvo</Badge>}
                          {item.status === 'ERROR' && <Badge variant="danger">{item.error || 'Erro'}</Badge>}
                          {item.status === 'EXTRACTING' && <Badge variant="info">Extraindo...</Badge>}
                          {item.status === 'PENDING' && <Badge variant="neutral">Pendente</Badge>}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-slate-400" onClick={() => handleOpenEditModal(item)}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL DE EDIÇÃO INLINE (Para produtos com NEEDS_REVIEW ou ajuste prévio) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-blue-400" />
                <span>Revisão Manual do Produto</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="text-slate-400 text-[11px]">
              Edite as informações abaixo. Quaisquer edições salvas aqui prevalecerão como o <strong>briefing factual do produto</strong> para a geração de Copy e catálogo.
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Título do Produto:</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Preço Atual (R$):</label>
                <input
                  type="text"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  onBlur={() => setEditPrice(Price.formatBRL(Price.parseBRL(editPrice)))}
                  placeholder="R$ 1.000,00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-emerald-400 font-bold font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Categoria Oficial:</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                >
                  {OFFICIAL_TAXONOMY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Descrição / Briefing Factual do Produto:</label>
              <textarea
                rows={5}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Insira características, voltagem, diferenciais e detalhes do produto..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setEditingItem(null)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveInlineEdit}>
                Salvar Alterações no Staging
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
