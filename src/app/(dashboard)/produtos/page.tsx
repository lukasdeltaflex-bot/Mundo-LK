'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { MarketplaceBadge } from '@/presentation/components/business/MarketplaceBadge';
import {
  ShoppingBag, Plus, Layers, Sparkles, Trash2, X, AlertTriangle, CheckCircle2,
  Search, LayoutGrid, List, Filter, Copy, ExternalLink, RefreshCw, ChevronLeft, ChevronRight,
  TrendingDown, Tag, Clock, ArrowUpDown, Image as ImageIcon, Check
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/core/domain/entities/category.entity';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { Product } from '@/core/domain/entities/product.entity';
import { useAuth } from '@/presentation/context/AuthContext';
import { DeletionReason, SmartTrashService } from '@/core/domain/services/smart-trash.service';

// ─── Image Fallback Component with Lazy Loading ──────────────────────────────

function ProductImageThumbnail({ src, title }: { src?: string; title: string }) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800/80 group-hover:border-slate-700 transition">
      {!loaded && !imgError && (
        <div className="absolute inset-0 animate-pulse bg-slate-900 flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-slate-700" />
        </div>
      )}

      {src && !imgError ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setImgError(true)}
          className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-slate-900 to-slate-950 p-4 text-center">
          <ShoppingBag className="h-8 w-8 text-blue-500/40" />
          <span className="text-[10px] font-medium text-slate-500 truncate max-w-[90%]">
            {title || 'Imagem indisponível'}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton Loading Cards ──────────────────────────────────────────────────

function ProductSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-3 animate-pulse">
          <div className="aspect-[4/3] w-full rounded-xl bg-slate-800/60" />
          <div className="h-4 w-3/4 bg-slate-800/60 rounded" />
          <div className="h-3 w-1/2 bg-slate-800/40 rounded" />
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div className="h-6 w-20 bg-slate-800/60 rounded" />
            <div className="h-7 w-24 bg-slate-800/60 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Types & Storage Keys ───────────────────────────────────────────────────

type ViewMode = 'grid' | 'list';
type SortOption = 'recentes' | 'menor_preco' | 'maior_preco' | 'maior_desconto';

const LS_VIEW = 'mundo_lk_products_view';
const LS_SORT = 'mundo_lk_products_sort';
const LS_MARKETPLACE = 'mundo_lk_products_mkt';

const MARKETPLACES_LIST = [
  { slug: 'TODOS', name: 'Todos os Marketplaces' },
  { slug: 'shopee', name: 'Shopee' },
  { slug: 'mercadolivre', name: 'Mercado Livre' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'magalu', name: 'Magalu' },
  { slug: 'aliexpress', name: 'AliExpress' },
  { slug: 'tiktok', name: 'TikTok Shop' },
];

export default function ProdutosPage() {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [sortOption, setSortOption] = useState<SortOption>('recentes');
  const [onlyPromotions, setOnlyPromotions] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // UI Toast / Copied State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Trash Modal State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletionReason, setDeletionReason] = useState<DeletionReason>('Oferta encerrada');
  const [showHighImpactWarn, setShowHighImpactWarn] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Hydrate User Preferences from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedView = localStorage.getItem(LS_VIEW) as ViewMode;
      if (savedView === 'grid' || savedView === 'list') setViewMode(savedView);

      const savedSort = localStorage.getItem(LS_SORT) as SortOption;
      if (savedSort) setSortOption(savedSort);

      const savedMkt = localStorage.getItem(LS_MARKETPLACE);
      if (savedMkt) setSelectedMarketplace(savedMkt);
    } catch {
      // ignore
    }
  }, []);

  // Save Preferences to LocalStorage
  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') localStorage.setItem(LS_VIEW, mode);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
    if (typeof window !== 'undefined') localStorage.setItem(LS_SORT, sort);
  };

  const handleMarketplaceChange = (mkt: string) => {
    setSelectedMarketplace(mkt);
    setCurrentPage(1);
    if (typeof window !== 'undefined') localStorage.setItem(LS_MARKETPLACE, mkt);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const repo = new FirestoreProductRepository();
      const uid = user?.uid || 'guest';
      const list = await repo.findAll(uid);
      setProducts(list);
    } catch (err) {
      console.warn('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenTrashModal = (prod: Product) => {
    setDeletingProduct(prod);
    setDeletionReason('Oferta encerrada');
    const isHigh = SmartTrashService.shouldWarnBeforeDeletion(0, 90);
    setShowHighImpactWarn(isHigh);
  };

  const handleConfirmMoveToTrash = async () => {
    if (!deletingProduct) return;
    setProcessing(true);

    try {
      const repo = new FirestoreProductRepository();
      const uid = user?.uid || 'guest';
      await repo.moveToTrash(deletingProduct.id, deletionReason, uid);

      setProducts(products.filter((p) => p.id !== deletingProduct.id));
      setSuccessMsg('Produto movido para a lixeira inteligente.');
      setDeletingProduct(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao mover produto para a lixeira:', err);
    } finally {
      setProcessing(false);
    }
  };

  // ── Smart Filter & Sorting Engine ─────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Marketplace Filter
      if (selectedMarketplace !== 'TODOS' && p.marketplaceSlug !== selectedMarketplace) {
        return false;
      }
      // 2. Category Filter
      if (selectedCategory !== 'TODAS' && p.categoryId !== selectedCategory && p.brand !== selectedCategory) {
        return false;
      }
      // 3. Promotion Only Filter
      if (onlyPromotions && (!p.discountPercentage || p.discountPercentage.value <= 0)) {
        return false;
      }
      // 4. Live Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchCategory = p.categoryId.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchMkt = p.marketplaceSlug.toLowerCase().includes(q);
        if (!matchTitle && !matchBrand && !matchCategory && !matchId && !matchMkt) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortOption === 'recentes') {
        return (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      }
      if (sortOption === 'menor_preco') {
        return (a.currentPrice?.amount || 0) - (b.currentPrice?.amount || 0);
      }
      if (sortOption === 'maior_preco') {
        return (b.currentPrice?.amount || 0) - (a.currentPrice?.amount || 0);
      }
      if (sortOption === 'maior_desconto') {
        return (b.discountPercentage?.value || 0) - (a.discountPercentage?.value || 0);
      }
      return 0;
    });
  }, [products, selectedMarketplace, selectedCategory, searchQuery, onlyPromotions, sortOption]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <span>Catálogo Minimalista Premium</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão visual profissional dos seus produtos cadastrados nos marketplaces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard">
            <Button size="sm" variant="primary" className="text-xs shadow-lg shadow-blue-600/20" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Novo Produto
            </Button>
          </Link>
          <Link href="/lote">
            <Button size="sm" variant="secondary" className="text-xs" leftIcon={<Layers className="h-3.5 w-3.5" />}>
              Importar Lote
            </Button>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200 shadow-lg shadow-emerald-950/20">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Search, Filters & View Control Bar ─────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 shadow-md">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Buscar por nome, marca, categoria ou ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Selector */}
            <div className="relative flex items-center">
              <ArrowUpDown className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="recentes">Mais recentes</option>
                <option value="maior_desconto">Maior Desconto (% OFF)</option>
                <option value="menor_preco">Menor Preço (R$)</option>
                <option value="maior_preco">Maior Preço (R$)</option>
              </select>
            </div>

            {/* Promotions Toggle */}
            <button
              onClick={() => { setOnlyPromotions(!onlyPromotions); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                onlyPromotions
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Promoções</span>
            </button>

            {/* View Mode Toggle (Grid / List) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => handleViewChange('grid')}
                title="Visualização em Cards"
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewChange('list')}
                title="Visualização em Tabela"
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Marketplace Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {MARKETPLACES_LIST.map((mkt) => (
            <button
              key={mkt.slug}
              onClick={() => handleMarketplaceChange(mkt.slug)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedMarketplace === mkt.slug
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {mkt.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content View ────────────────────────────────────────────────────── */}
      {loading ? (
        <ProductSkeletonGrid />
      ) : filteredProducts.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/40 rounded-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nenhum produto encontrado.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            {searchQuery || selectedMarketplace !== 'TODOS'
              ? 'Nenhum resultado corresponde aos seus filtros de busca atuais.'
              : 'Cole a URL de um produto no Dashboard para cadastrá-lo automaticamente no seu catálogo.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {searchQuery || selectedMarketplace !== 'TODOS' ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => { setSearchQuery(''); setSelectedMarketplace('TODOS'); setOnlyPromotions(false); }}
              >
                Limpar Filtros
              </Button>
            ) : (
              <Link href="/dashboard">
                <Button variant="primary" size="sm" className="text-xs" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                  Importar 1º Produto
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        /* ── Grid Cards View ───────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((p) => {
            const hasDiscount = p.discountPercentage && p.discountPercentage.value > 0;
            const formattedPrice = p.currentPrice ? (p.currentPrice.formatBRL ? p.currentPrice.formatBRL() : `R$ ${p.currentPrice.amount}`) : 'R$ —';
            const formattedOldPrice = p.previousPrice ? (p.previousPrice.formatBRL ? p.previousPrice.formatBRL() : `R$ ${p.previousPrice.amount}`) : null;
            const mainImg = p.images && p.images.length > 0 ? p.images[0] : undefined;
            const isCopied = copiedId === p.id;
            const targetUrl = p.affiliateUrl?.url || p.originalUrl;

            return (
              <div
                key={p.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/90 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10"
              >
                {/* Image & Overlay Actions */}
                <div className="relative mb-3">
                  <ProductImageThumbnail src={mainImg} title={p.title} />

                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <MarketplaceBadge marketplaceSlug={p.marketplaceSlug} />
                    {hasDiscount && (
                      <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-extrabold text-slate-950 shadow">
                        🔥 {p.discountPercentage.value}% OFF
                      </span>
                    )}
                  </div>

                  {/* Top Right Quick Badges */}
                  <div className="absolute top-2 right-2">
                    <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 backdrop-blur-md">
                      🟢 Ativo
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="space-y-2 flex-1">
                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-relaxed group-hover:text-blue-300 transition">
                    {p.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{p.brand || p.categoryId || 'Geral'}</span>
                    <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : ''}</span>
                  </div>

                  {/* Price Section */}
                  <div className="pt-2 flex items-baseline justify-between border-t border-slate-800/80">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-extrabold text-emerald-400">{formattedPrice}</span>
                      {formattedOldPrice && (
                        <span className="text-[11px] text-slate-500 line-through font-mono">{formattedOldPrice}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1.5">
                  <Button
                    size="sm"
                    variant={isCopied ? 'success' : 'secondary'}
                    className="text-[11px] px-2 py-1.5 h-8"
                    leftIcon={isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    onClick={() => handleCopyLink(p.id, targetUrl)}
                  >
                    {isCopied ? 'Copiado!' : 'Copiar'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] px-2 py-1.5 h-8"
                    leftIcon={<ExternalLink className="h-3 w-3" />}
                    onClick={() => window.open(targetUrl, '_blank')}
                  >
                    Ver
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    className="text-[11px] px-2 py-1.5 h-8"
                    title="Mover para a Lixeira"
                    onClick={() => handleOpenTrashModal(p)}
                  >
                    <Trash2 className="h-3 w-3 mx-auto" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List / Table View ──────────────────────────────────────────── */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Produto</th>
                  <th className="py-3.5 px-4">Marketplace</th>
                  <th className="py-3.5 px-4">Preço</th>
                  <th className="py-3.5 px-4">Desconto</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paginatedProducts.map((p) => {
                  const formattedPrice = p.currentPrice ? (p.currentPrice.formatBRL ? p.currentPrice.formatBRL() : `R$ ${p.currentPrice.amount}`) : 'R$ —';
                  const mainImg = p.images && p.images.length > 0 ? p.images[0] : undefined;
                  const isCopied = copiedId === p.id;
                  const targetUrl = p.affiliateUrl?.url || p.originalUrl;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-950 border border-slate-800">
                            {mainImg ? (
                              <img src={mainImg} alt={p.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-600">
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white line-clamp-1 max-w-xs">{p.title}</p>
                            <span className="text-[10px] text-slate-400">{p.brand || 'Sem marca'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <MarketplaceBadge marketplaceSlug={p.marketplaceSlug} />
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {formattedPrice}
                      </td>
                      <td className="py-3 px-4">
                        {p.discountPercentage && p.discountPercentage.value > 0 ? (
                          <Badge variant="warning">{p.discountPercentage.value}% OFF</Badge>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          🟢 Ativo
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant={isCopied ? 'success' : 'secondary'}
                            className="text-xs"
                            onClick={() => handleCopyLink(p.id, targetUrl)}
                          >
                            {isCopied ? 'Copiado' : 'Copiar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => window.open(targetUrl, '_blank')}
                          >
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="text-xs p-2"
                            onClick={() => handleOpenTrashModal(p)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination Controls ──────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-800/80">
          <span>
            Exibindo {paginatedProducts.length} de {filteredProducts.length} produtos
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-3 py-1 font-semibold text-white">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Modal Mover para a Lixeira ───────────────────────────────────────── */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-slate-900 border-slate-800 animate-in fade-in zoom-in-95 duration-150 rounded-2xl shadow-2xl">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Enviar produto para a lixeira?</CardTitle>
                <button onClick={() => setDeletingProduct(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription className="text-xs mt-1 text-slate-300 font-semibold">{deletingProduct.title}</CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4 text-xs">
              {showHighImpactWarn && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Este produto possui histórico ativo. Ele será movido para a lixeira temporária.</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Selecione o motivo da exclusão:</label>
                <select
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value as DeletionReason)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Produto esgotado">Produto esgotado</option>
                  <option value="Oferta encerrada">Oferta encerrada</option>
                  <option value="Link inválido">Link inválido</option>
                  <option value="Produto duplicado">Produto duplicado</option>
                  <option value="Baixo desempenho">Baixo desempenho</option>
                  <option value="Outro">Outro motivo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDeletingProduct(null)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={processing}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={handleConfirmMoveToTrash}
                >
                  {processing ? 'Enviando...' : 'Confirmar Exclusão'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
