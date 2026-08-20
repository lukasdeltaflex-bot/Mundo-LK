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
  TrendingDown, Tag, Clock, ArrowUpDown, Image as ImageIcon, Check, Send, History, AlertCircle,
  Radio, BarChart3, ShieldAlert, Sparkle, Flame, Zap, Share2, ChevronDown, Lock, Unlock, Settings, Edit2
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/core/domain/entities/category.entity';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { Product, DispatchRecord, DispatchStatus, CategorySource } from '@/core/domain/entities/product.entity';
import { Offer } from '@/core/domain/entities/offer.entity';
import { ManagedCategory } from '@/core/domain/entities/managed-category.entity';
import { DispatchChannel } from '@/core/domain/entities/dispatch-channel.entity';
import { TargetGroup } from '@/core/domain/entities/target-group.entity';
import { FirestoreCategoryRepository } from '@/infrastructure/firebase/repositories/firestore-category.repository';
import { FirestoreCategoryPreferenceRepository } from '@/infrastructure/firebase/repositories/firestore-category-preference.repository';
import { FirestoreDispatchChannelRepository } from '@/infrastructure/firebase/repositories/firestore-dispatch-channel.repository';
import { FirestoreTargetGroupRepository } from '@/infrastructure/firebase/repositories/firestore-target-group.repository';
import { ProductCategorizationService } from '@/core/domain/services/ProductCategorizationService';
import { CategorySelectorModal } from '@/presentation/components/business/CategorySelectorModal';
import { BulkCategoryModal } from '@/presentation/components/business/BulkCategoryModal';
import { BulkDeleteModal } from '@/presentation/components/business/BulkDeleteModal';
import { DispatchOptionsManagerModal } from '@/presentation/components/business/DispatchOptionsManagerModal';
import { CategoryManagementTab } from '@/presentation/components/business/CategoryManagementTab';
import { EditProductModal } from '@/presentation/components/business/EditProductModal';
import { useAuth } from '@/presentation/context/AuthContext';
import { DeletionReason, SmartTrashService } from '@/core/domain/services/smart-trash.service';
import { SocialShareModal, SocialShareData } from '@/presentation/components/business/SocialShareModal';
import { MagaluDiscoveryModal } from '@/presentation/components/business/MagaluDiscoveryModal';
import { PaginationControls } from '@/presentation/components/ui/PaginationControls';
import { useFirestorePagination } from '@/presentation/hooks/useFirestorePagination';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { ensurePriceBoldInCopy } from '@/core/utils/price-formatting.utils';

// ─── Image Fallback Component with Lazy Loading ──────────────────────────────

import { FirebaseStorageService } from '@/infrastructure/firebase/storage/firebase-storage.service';

function ProductImageThumbnail({ src, title }: { src?: string; title: string }) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const displayUrl = src ? FirebaseStorageService.getDisplayUrl(src) : '';

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800/80 group-hover:border-slate-700 transition">
      {!loaded && !imgError && (
        <div className="absolute inset-0 animate-pulse bg-slate-900 flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-slate-700" />
        </div>
      )}

      {displayUrl && !imgError ? (
        <img
          src={displayUrl}
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

// ─── Traffic Light Status Badge Component ─────────────────────────────────────

function DispatchStatusBadge({ status }: { status: DispatchStatus }) {
  switch (status) {
    case 'NUNCA_ENVIADA':
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-extrabold text-emerald-400 backdrop-blur-md shadow-sm max-w-full whitespace-normal break-words leading-tight">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          🟢 Nunca enviada (Alta prioridade)
        </span>
      );
    case 'ENVIADA_HOJE':
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 text-[10px] font-extrabold text-blue-400 backdrop-blur-md max-w-full whitespace-normal break-words leading-tight">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
          🔵 Enviada hoje
        </span>
      );
    case 'ENVIADA_RECENTEMENTE':
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/30 px-2.5 py-1 text-[10px] font-extrabold text-red-400 backdrop-blur-md max-w-full whitespace-normal break-words leading-tight">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
          🔴 Enviada recentemente (&lt;3d)
        </span>
      );
    case 'CANDIDATA_REENVIO':
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-extrabold text-amber-400 backdrop-blur-md max-w-full whitespace-normal break-words leading-tight">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
          🟡 Reenvio recomendado (&gt;15d)
        </span>
      );
    case 'AGUARDANDO_REENVIO':
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700/60 px-2.5 py-1 text-[10px] font-semibold text-slate-300 backdrop-blur-md max-w-full whitespace-normal break-words leading-tight">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
          ⚪ Aguardando reenvio (3-15d)
        </span>
      );
    default:
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-slate-400 max-w-full whitespace-normal break-words leading-tight">
          ⚪ Arquivada
        </span>
      );
  }
}

// ─── Types & Storage Keys ───────────────────────────────────────────────────

type ViewMode = 'grid' | 'list';
type SortOption =
  | 'nunca_enviada'
  | 'mais_enviada'
  | 'menos_enviada'
  | 'ultimo_envio'
  | 'recentes'
  | 'maior_desconto'
  | 'menor_preco'
  | 'maior_preco';

type DispatchFilter = 'TODOS' | 'NUNCA_ENVIADA' | 'ENVIADA_HOJE' | 'CANDIDATA_REENVIO' | 'ENVIADA_RECENTEMENTE';

const LS_VIEW = 'mundo_lk_products_view';
const LS_SORT = 'mundo_lk_products_sort';
const LS_MARKETPLACE = 'mundo_lk_products_mkt';

const MARKETPLACES_LIST = [
  { slug: 'TODOS', name: 'Todos os Marketplaces' },
  { slug: 'shopee', name: 'Shopee' },
  { slug: 'mercadolivre', name: 'Mercado Livre' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'magalu', name: 'Magalu (Magaz. Luiza)' },
  { slug: 'shein', name: 'SHEIN' },
  { slug: 'aliexpress', name: 'AliExpress' },
  { slug: 'tiktok', name: 'TikTok Shop' },
  { slug: 'casasbahia', name: 'Casas Bahia' },
  { slug: 'kabum', name: 'KabuM!' },
];

export default function ProdutosPage() {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [offersMap, setOffersMap] = useState<Record<string, Offer[]>>({});
  const [loading, setLoading] = useState(true);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedDispatchFilter, setSelectedDispatchFilter] = useState<DispatchFilter>('TODOS');
  const [sortOption, setSortOption] = useState<SortOption>('nunca_enviada');
  const [onlyPromotions, setOnlyPromotions] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // UI Feedback / Copied State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dispatch Registration Modal State
  const [dispatchingProduct, setDispatchingProduct] = useState<Product | null>(null);
  const [channel, setChannel] = useState('WhatsApp Promoções 01');
  const [targetGroup, setTargetGroup] = useState('Grupo VIP #01');
  const [notes, setNotes] = useState('');
  const [dispatchType, setDispatchType] = useState<'MANUAL' | 'AUTOMATIC'>('MANUAL');

  // Dispatch History Modal State
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  // Social Share Modal State
  const [shareModalData, setShareModalData] = useState<SocialShareData | null>(null);

  const handleShareProduct = (p: Product) => {
    const formattedPrice = p.currentPrice ? p.currentPrice.formatBRL() : 'R$ 0,00';
    const formattedOldPrice = p.previousPrice ? p.previousPrice.formatBRL() : undefined;
    const discountPercent = p.discountPercentage ? `${p.discountPercentage.value}% OFF` : undefined;

    const getUrlString = (link: any, defaultUrl: string = ''): string => {
      if (!link) return defaultUrl;
      if (typeof link === 'string') return link;
      if (typeof link === 'object') {
        if (typeof link.url === 'string' && link.url) return link.url;
        if (typeof link.value === 'string' && link.value) return link.value;
      }
      return defaultUrl;
    };

    const affiliateUrl = getUrlString(p.affiliateUrl, p.originalUrl || '');
    const imageUrl = p.images && p.images.length > 0 ? p.images[0] : undefined;

    const savedOffers = offersMap[p.id] || [];
    const savedOffer = savedOffers[0];
    const copies = savedOffer?.copies?.copies;

    const savedWhatsApp = copies?.whatsAppText || copies?.longText;
    const savedTelegram = copies?.telegramText || savedWhatsApp;
    const savedInstagram = copies?.instagramText || savedWhatsApp;
    const savedFacebook = copies?.facebookText || savedWhatsApp;
    const fallbackCopy = `🔥 *${p.title}*\n\n💰 Por apenas *${formattedPrice}*${formattedOldPrice ? ` (De ${formattedOldPrice})` : ''}\n\n👉 Confira no link oficial:\n${affiliateUrl}`;

    const rawWhatsApp = savedWhatsApp || fallbackCopy;
    const rawTelegram = savedTelegram || savedWhatsApp || fallbackCopy;
    const rawInstagram = savedInstagram || savedWhatsApp || fallbackCopy;
    const rawFacebook = savedFacebook || savedWhatsApp || fallbackCopy;

    setShareModalData({
      offerId: savedOffer?.id,
      title: p.title,
      price: formattedPrice,
      previousPrice: formattedOldPrice,
      discountPercent,
      imageUrl,
      affiliateUrl,
      whatsAppText: ensurePriceBoldInCopy(rawWhatsApp, formattedPrice),
      telegramText: ensurePriceBoldInCopy(rawTelegram, formattedPrice),
      instagramText: ensurePriceBoldInCopy(rawInstagram, formattedPrice),
      facebookText: ensurePriceBoldInCopy(rawFacebook, formattedPrice),
    });
  };

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
    if (!user?.uid) {
      console.log('[PRODUTOS] loadProducts abortado: usuário não autenticado');
      return;
    }
    setLoading(true);
    try {
      const productRepo = new FirestoreProductRepository();
      const offerRepo = new FirestoreOfferRepository();
      const uid = user.uid;

      const [list, offerList] = await Promise.all([
        productRepo.findAll(uid),
        offerRepo.findByUserId(uid),
      ]);

      setProducts(list);

      const map: Record<string, Offer[]> = {};
      offerList.forEach((off) => {
        if (off.productId) {
          if (!map[off.productId]) map[off.productId] = [];
          map[off.productId].push(off);
        }
      });
      setOffersMap(map);
    } catch (err) {
      console.warn('Erro ao carregar produtos e ofertas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  // ── Categorization State (Fase 4) ──────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'catalogo' | 'categorias'>('catalogo');
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [categoryModalProduct, setCategoryModalProduct] = useState<Product | null>(null);
  const [isBulkCategoryModalOpen, setIsBulkCategoryModalOpen] = useState<boolean>(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [isMoreActionsMenuOpen, setIsMoreActionsMenuOpen] = useState<boolean>(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [categorizingWithAI, setCategorizingWithAI] = useState<boolean>(false);
  const [selectedCategorySourceFilter, setSelectedCategorySourceFilter] = useState<string>('TODOS');

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisible = (visibleProducts: Product[]) => {
    const visibleIds = visibleProducts.map((p) => p.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.includes(id));

    if (allSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleRunAICategorizationForSelected = async () => {
    if (!user?.uid || categories.length === 0 || selectedProductIds.length === 0) return;
    setCategorizingWithAI(true);
    try {
      const selectedProds = products.filter((p) => selectedProductIds.includes(p.id));
      const lockedProds = selectedProds.filter((p) => p.categoryLocked);
      const eligibleProds = selectedProds.filter((p) => !p.categoryLocked);

      if (eligibleProds.length === 0) {
        setSuccessMsg(
          `Todos os ${selectedProds.length} produtos selecionados estão bloqueados contra alterações da IA.`
        );
        setTimeout(() => setSuccessMsg(null), 4000);
        return;
      }

      const service = new ProductCategorizationService();
      const productRepo = new FirestoreProductRepository();
      const prefRepo = new FirestoreCategoryPreferenceRepository();

      const preferences = await prefRepo.findByUserId(user.uid);
      let updatedCount = 0;

      for (const product of eligibleProds) {
        const result = await service.classifyProduct(product, categories, preferences);
        if (result.categoryId && result.source !== 'SYSTEM') {
          product.updateCategory({
            categoryId: result.categoryId,
            subcategoryId: result.subcategoryId,
            source: result.source as CategorySource,
            confidence: result.confidence,
            reasoning: result.reasoning,
          });
          await productRepo.save(product);
          updatedCount++;
        }
      }

      await loadProducts();
      setSuccessMsg(
        `IA analisou ${eligibleProds.length} produtos (${updatedCount} atualizados). ${lockedProds.length} ignorados por estarem bloqueados.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Erro na categorização por IA dos selecionados:', err);
    } finally {
      setCategorizingWithAI(false);
      setIsMoreActionsMenuOpen(false);
    }
  };

  const handleBulkSetLock = async (locked: boolean) => {
    if (selectedProductIds.length === 0 || !user?.uid) return;
    setProcessing(true);
    try {
      const selectedProds = products.filter((p) => selectedProductIds.includes(p.id));
      selectedProds.forEach((p) => {
        p.updateCategory({
          categoryId: p.categoryId,
          subcategoryId: p.subcategoryId,
          source: 'MANUAL',
          confidence: p.categoryConfidence,
          locked,
          reasoning: locked
            ? 'Bloqueado manualmente em massa pelo usuário.'
            : 'Desbloqueado manualmente em massa pelo usuário.',
        });
      });

      const repo = new FirestoreProductRepository();
      await repo.updateCategoryBatch(selectedProds);

      setSuccessMsg(
        `${selectedProds.length} produtos ${locked ? 'bloqueados' : 'desbloqueados'} com sucesso!`
      );
      setSelectedProductIds([]);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao alterar trava em massa:', err);
    } finally {
      setProcessing(false);
      setIsMoreActionsMenuOpen(false);
    }
  };

  // ── Dispatch Channels & Target Groups State ──────────────────────────────
  const [dispatchChannels, setDispatchChannels] = useState<DispatchChannel[]>([]);
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>([]);
  const [isOptionsManagerOpen, setIsOptionsManagerOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isMagaluDiscoveryOpen, setIsMagaluDiscoveryOpen] = useState<boolean>(false);

  const loadDispatchOptions = async () => {
    if (!user?.uid) return;
    try {
      const chanRepo = new FirestoreDispatchChannelRepository();
      const groupRepo = new FirestoreTargetGroupRepository();

      const [chanList, groupList] = await Promise.all([
        chanRepo.findAll(user.uid),
        groupRepo.findAll(user.uid),
      ]);

      setDispatchChannels(chanList);
      setTargetGroups(groupList);
    } catch (err) {
      console.warn('Erro ao carregar canais e grupos de envio:', err);
    }
  };

  const loadCategories = async () => {
    if (!user?.uid) return;
    try {
      const categoryRepo = new FirestoreCategoryRepository();
      let list = await categoryRepo.findAll(user.uid);
      if (list.length === 0) {
        list = await categoryRepo.seedDefaultsIfEmpty(user.uid);
      }
      setCategories(list);
    } catch (err) {
      console.warn('Erro ao carregar categorias:', err);
    }
  };

  useEffect(() => {
    loadCategories();
    loadDispatchOptions();
  }, [user]);

  const handleRunAICategorizationForUncategorized = async () => {
    if (!user?.uid || categories.length === 0) return;
    setCategorizingWithAI(true);
    try {
      const service = new ProductCategorizationService();
      const productRepo = new FirestoreProductRepository();
      const prefRepo = new FirestoreCategoryPreferenceRepository();

      const preferences = await prefRepo.findByUserId(user.uid);
      const uncategorized = products.filter((p) => !p.categoryId || p.categoryId === 'Geral' || p.categorySource === 'SYSTEM');

      let updatedCount = 0;
      for (const product of uncategorized) {
        const result = await service.classifyProduct(product, categories, preferences);
        if (result.categoryId && result.source !== 'SYSTEM') {
          product.updateCategory({
            categoryId: result.categoryId,
            subcategoryId: result.subcategoryId,
            source: result.source as CategorySource,
            confidence: result.confidence,
            reasoning: result.reasoning,
          });
          await productRepo.save(product);
          updatedCount++;
        }
      }

      await loadProducts();
      setSuccessMsg(`Categorização por IA concluída! ${updatedCount} produtos categorizados.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Erro na categorização por IA:', err);
    } finally {
      setCategorizingWithAI(false);
    }
  };

  const realCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ── Dispatch Registration Submit ──────────────────────────────────────────

  const handleRecordDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchingProduct) return;
    setProcessing(true);

    try {
      // Record dispatch on domain entity
      dispatchingProduct.recordDispatch({
        channel,
        targetGroup,
        sentBy: user?.name || user?.email || 'Admin',
        type: dispatchType,
        notes,
      });

      // Save updated product state to Firestore
      const repo = new FirestoreProductRepository();
      await repo.updateDispatchHistory(dispatchingProduct);

      // Force UI state refresh
      setProducts([...products]);
      setSuccessMsg(`Envio registrado com sucesso para o canal ${channel}! (Total: ${dispatchingProduct.dispatchCount}x)`);
      setDispatchingProduct(null);
      setNotes('');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao registrar envio da oferta:', err);
    } finally {
      setProcessing(false);
    }
  };

  // ── Trash Actions ──────────────────────────────────────────────────────────

  const handleOpenTrashModal = (prod: Product) => {
    setDeletingProduct(prod);
    setDeletionReason('Oferta encerrada');
    const isHigh = SmartTrashService.shouldWarnBeforeDeletion(0, 90);
    setShowHighImpactWarn(isHigh);
  };

  const handleConfirmMoveToTrash = async () => {
    if (!deletingProduct || !user?.uid) return;
    setProcessing(true);

    try {
      const repo = new FirestoreProductRepository();
      const uid = user.uid;
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

  // ── Summary Campaign Statistics ───────────────────────────────────────────

  const campaignStats = useMemo(() => {
    const total = products.length;
    let nuncaEnviadas = 0;
    let enviadasHoje = 0;
    let candidatasReenvio = 0;
    let enviadasRecentes = 0;
    let totalDispatchesSum = 0;

    for (const p of products) {
      const status = p.getDispatchStatus();
      if (status === 'NUNCA_ENVIADA') nuncaEnviadas++;
      if (status === 'ENVIADA_HOJE') enviadasHoje++;
      if (status === 'CANDIDATA_REENVIO') candidatasReenvio++;
      if (status === 'ENVIADA_RECENTEMENTE') enviadasRecentes++;
      totalDispatchesSum += p.dispatchCount || 0;
    }

    const averageDispatches = total > 0 ? (totalDispatchesSum / total).toFixed(1) : '0';

    return {
      total,
      nuncaEnviadas,
      enviadasHoje,
      candidatasReenvio,
      enviadasRecentes,
      averageDispatches,
    };
  }, [products]);

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
      // 3. Dispatch Status Filter
      if (selectedDispatchFilter !== 'TODOS') {
        const status = p.getDispatchStatus();
        if (status !== selectedDispatchFilter) return false;
      }
      // 4. Promotion Only Filter
      if (onlyPromotions && (!p.discountPercentage || p.discountPercentage.value <= 0)) {
        return false;
      }
      // 5. Live Search Query
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
      // 6. Category Source / Lock Filter
      if (selectedCategorySourceFilter === 'LOCKED') {
        if (!p.categoryLocked) return false;
      } else if (selectedCategorySourceFilter !== 'TODOS') {
        if (p.categorySource !== selectedCategorySourceFilter) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortOption === 'nunca_enviada') {
        return (a.dispatchCount || 0) - (b.dispatchCount || 0);
      }
      if (sortOption === 'mais_enviada') {
        return (b.dispatchCount || 0) - (a.dispatchCount || 0);
      }
      if (sortOption === 'menos_enviada') {
        return (a.dispatchCount || 0) - (b.dispatchCount || 0);
      }
      if (sortOption === 'ultimo_envio') {
        const timeA = a.lastDispatchedAt ? new Date(a.lastDispatchedAt).getTime() : 0;
        const timeB = b.lastDispatchedAt ? new Date(b.lastDispatchedAt).getTime() : 0;
        return timeB - timeA;
      }
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
  }, [products, selectedMarketplace, selectedCategory, selectedDispatchFilter, selectedCategorySourceFilter, searchQuery, onlyPromotions, sortOption]);

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
              <Send className="h-5 w-5" />
            </div>
            <span>Central de Controle de Divulgação de Ofertas</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão inteligente de histórico de envios, frequência de campanhas e semáforo visual de reenvios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            leftIcon={<Sparkles className={`h-3.5 w-3.5 ${categorizingWithAI ? 'animate-spin' : ''}`} />}
            onClick={handleRunAICategorizationForUncategorized}
            disabled={categorizingWithAI}
          >
            {categorizingWithAI ? 'Categorizando com IA...' : 'Categorizar com IA'}
          </Button>

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
          <Button
            size="sm"
            variant="secondary"
            className="text-xs border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
            leftIcon={<Sparkles className="h-3.5 w-3.5 text-blue-400" />}
            onClick={() => setIsMagaluDiscoveryOpen(true)}
          >
            Descoberta Magalu
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar (Catálogo vs Central de Categorias) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('catalogo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'catalogo'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>Catálogo & Ofertas</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            activeTab === 'catalogo'
              ? 'bg-blue-800/80 text-white border border-blue-400/30'
              : 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-950/60 dark:text-slate-300 dark:border-transparent'
          }`}>
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categorias')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'categorias'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          <span>Central de Categorias</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            activeTab === 'categorias'
              ? 'bg-blue-800/80 text-white border border-blue-400/30'
              : 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-950/60 dark:text-slate-300 dark:border-transparent'
          }`}>
            {categories.filter((c) => !c.parentCategoryId).length}
          </span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200 shadow-lg shadow-emerald-950/20">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Campaign Control Summary Dashboard KPI Cards ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400">📦 Total Ofertas</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{campaignStats.total}</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            🟢 Nunca Enviadas
          </span>
          <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">{campaignStats.nuncaEnviadas}</div>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1">
            🔵 Enviadas Hoje
          </span>
          <div className="text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">{campaignStats.enviadasHoje}</div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            🟡 Prontas (&gt;15d)
          </span>
          <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">{campaignStats.candidatasReenvio}</div>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
            🔴 Recentes (&lt;3d)
          </span>
          <div className="text-xl font-extrabold text-red-700 dark:text-red-300 mt-1">{campaignStats.enviadasRecentes}</div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">📊 Média de Envios</span>
          <div className="text-xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">{campaignStats.averageDispatches}x</div>
        </div>
      </div>

      {activeTab === 'categorias' ? (
        <CategoryManagementTab categories={categories} products={products} onRefresh={loadProducts} />
      ) : (
        <div className="space-y-6">
          {/* ── Sticky / Floating Bulk Action Bar (Fase 4 Adendo) ────────────────── */}
          {selectedProductIds.length > 0 && (
            <div className="sticky top-4 z-40 flex flex-wrap items-center justify-between gap-3 bg-blue-950/90 border border-blue-500/40 p-3.5 rounded-2xl backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-md">
                  {selectedProductIds.length}
                </span>
                <span className="text-xs font-bold text-blue-200">
                  {selectedProductIds.length === 1 ? '1 produto selecionado' : `${selectedProductIds.length} produtos selecionados`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Primary Action: Alterar Categoria */}
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs shadow-md shadow-blue-600/30"
                  leftIcon={<Layers className="h-3.5 w-3.5" />}
                  onClick={() => setIsBulkCategoryModalOpen(true)}
                >
                  Alterar Categoria
                </Button>

                {/* Primary Action: Excluir */}
                <Button
                  size="sm"
                  variant="danger"
                  className="text-xs shadow-md shadow-red-600/30"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                >
                  Excluir
                </Button>

                {/* Dropdown: Mais Ações */}
                <div className="relative">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs border-slate-700 text-slate-200"
                    rightIcon={<ChevronDown className="h-3.5 w-3.5" />}
                    onClick={() => setIsMoreActionsMenuOpen(!isMoreActionsMenuOpen)}
                  >
                    Mais ações
                  </Button>

                  {isMoreActionsMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-1.5 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95 space-y-1">
                      <button
                        onClick={handleRunAICategorizationForSelected}
                        disabled={categorizingWithAI}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition font-medium text-purple-300 text-left"
                      >
                        <Sparkles className={`h-3.5 w-3.5 text-purple-400 ${categorizingWithAI ? 'animate-spin' : ''}`} />
                        <span>Categorizar com IA</span>
                      </button>

                      <button
                        onClick={() => handleBulkSetLock(true)}
                        disabled={processing}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition font-medium text-amber-300 text-left"
                      >
                        <Lock className="h-3.5 w-3.5 text-amber-400" />
                        <span>Bloquear Categoria</span>
                      </button>

                      <button
                        onClick={() => handleBulkSetLock(false)}
                        disabled={processing}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition font-medium text-emerald-300 text-left"
                      >
                        <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Desbloquear Categoria</span>
                      </button>

                      <div className="border-t border-slate-800 my-1"></div>

                      <button
                        onClick={() => {
                          setSelectedProductIds([]);
                          setIsMoreActionsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition font-medium text-slate-400 hover:text-white text-left"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Limpar seleção</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Real Firestore Derived Category Counters Tab Bar ───────────────── */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => { setSelectedCategory('TODAS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCategory === 'TODAS'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span>Todos</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                selectedCategory === 'TODAS'
                  ? 'bg-blue-800/80 text-white border border-blue-400/30'
                  : 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-950/60 dark:text-slate-300 dark:border-transparent'
              }`}>
                {products.length}
              </span>
            </button>
            {categories
              .filter((c) => !c.parentCategoryId && c.active)
              .map((cat) => {
                const count = realCategoryCounts[cat.name] || realCategoryCounts[cat.id] || 0;
                const isSelected = selectedCategory === cat.name || selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.name); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? 'bg-blue-800/80 text-white border border-blue-400/30'
                        : 'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-950/60 dark:text-slate-300 dark:border-transparent'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
          </div>

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
                  placeholder="Buscar oferta por nome, marca, categoria ou ID..."
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
                {/* Category Source & Lock Filter */}
                <select
                  value={selectedCategorySourceFilter}
                  onChange={(e) => { setSelectedCategorySourceFilter(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="TODOS">Todas as Origens IA/Manual</option>
                  <option value="AI">🤖 Classificado por IA</option>
                  <option value="MANUAL">👤 Definição Manual</option>
                  <option value="LEARNED">🧠 Aprendido por Memória</option>
                  <option value="LOCKED">🔒 Bloqueado contra IA</option>
                </select>
            {/* Sort Selector */}
            <div className="relative flex items-center">
              <ArrowUpDown className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="nunca_enviada">Nunca enviadas primeiro</option>
                <option value="mais_enviada">Mais divulgadas (Top Envios)</option>
                <option value="menos_enviada">Menos divulgadas</option>
                <option value="ultimo_envio">Último envio recente</option>
                <option value="recentes">Mais recentes no catálogo</option>
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

        {/* Dispatch Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'TODOS', label: 'Todas as Ofertas' },
            { id: 'NUNCA_ENVIADA', label: '🟢 Nunca Enviadas (Alta Prioridade)' },
            { id: 'ENVIADA_HOJE', label: '🔵 Enviadas Hoje' },
            { id: 'CANDIDATA_REENVIO', label: '🟡 Prontas para Reenvio (>15d)' },
            { id: 'ENVIADA_RECENTEMENTE', label: '🔴 Enviadas Recentes (<3d)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setSelectedDispatchFilter(tab.id as DispatchFilter); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedDispatchFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {tab.label}
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
          <h3 className="text-lg font-bold text-white mb-1">Nenhuma oferta encontrada.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            {searchQuery || selectedMarketplace !== 'TODOS' || selectedDispatchFilter !== 'TODOS' || selectedCategory !== 'TODAS' || onlyPromotions
              ? 'Nenhum resultado corresponde aos seus filtros de busca ou histórico de envios.'
              : 'Cole a URL de um produto no Dashboard para cadastrá-lo no seu catálogo de campanhas.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {searchQuery || selectedMarketplace !== 'TODOS' || selectedDispatchFilter !== 'TODOS' || selectedCategory !== 'TODAS' || onlyPromotions ? (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedMarketplace('TODOS');
                  setSelectedDispatchFilter('TODOS');
                  setSelectedCategory('TODAS');
                  setOnlyPromotions(false);
                  setCurrentPage(1);
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem(LS_MARKETPLACE);
                    localStorage.removeItem(LS_SORT);
                  }
                }}
              >
                Limpar Filtros
              </Button>
            ) : (
              <Link href="/dashboard">
                <Button variant="primary" size="sm" className="text-xs" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                  Importar 1ª Oferta
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
            const dispatchStatus = p.getDispatchStatus();

            return (
              <div
                key={p.id}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  selectedProductIds.includes(p.id)
                    ? 'border-blue-500 bg-blue-950/20 shadow-blue-500/10'
                    : 'border-slate-800/80 bg-slate-900/90 hover:border-blue-500/40 hover:shadow-blue-500/10'
                }`}
              >
                {/* Top Control Bar: Checkbox + Marketplace Badge & Discount Badge */}
                <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(p.id)}
                      onChange={() => toggleSelectProduct(p.id)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500 cursor-pointer shrink-0 shadow"
                    />
                    <MarketplaceBadge marketplaceSlug={p.marketplaceSlug} />
                  </div>

                  {hasDiscount && (
                    <span className="shrink-0 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-extrabold text-slate-950 shadow">
                      🔥 {p.discountPercentage.value}% OFF
                    </span>
                  )}
                </div>

                {/* Product Image Container */}
                <div className="relative mb-3 w-full overflow-hidden rounded-xl">
                  <ProductImageThumbnail src={mainImg} title={p.title} />
                </div>

                {/* Dedicated Marketplace Dispatch Status Row (In Flow, Flexible Container) */}
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5 min-w-0">
                  <DispatchStatusBadge status={dispatchStatus} />
                </div>

                {/* Card Content */}
                <div className="space-y-2 flex-1">
                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-relaxed group-hover:text-blue-300 transition">
                    {p.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{p.brand || 'Geral'}</span>
                    <button
                      type="button"
                      onClick={() => setCategoryModalProduct(p)}
                      className="hover:scale-105 transition"
                      title="Clique para editar a categoria deste produto"
                    >
                      {p.categorySource === 'AI' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.5 text-[9px] font-bold text-blue-400">
                          🤖 {p.categoryId || 'Sem Categoria'} {p.categoryConfidence ? `${Math.round(p.categoryConfidence * 100)}%` : ''}
                        </span>
                      ) : p.categorySource === 'MANUAL' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-bold text-purple-400">
                          👤 {p.categoryId || 'Sem Categoria'} {p.categoryLocked ? '🔒' : ''}
                        </span>
                      ) : p.categorySource === 'LEARNED' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                          🧠 {p.categoryId || 'Sem Categoria'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-400">
                          🏷️ {p.categoryId || 'Sem Categoria'}
                        </span>
                      )}
                    </button>
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

                  {/* Dispatch Campaign Metrics Box */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Send className="h-3 w-3 text-blue-400" />
                        Envios realizados:
                      </span>
                      <span className="text-white font-extrabold bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30">
                        {p.dispatchCount || 0}x
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                      <span>Último envio:</span>
                      <span className="text-slate-300 font-medium truncate max-w-[130px]">
                        {p.lastDispatchedAt
                          ? `${new Date(p.lastDispatchedAt).toLocaleDateString('pt-BR')} ${new Date(p.lastDispatchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                          : 'Nunca divulgado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Campaign Dispatch Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  {/* Linha 1: Ações Principais — Registrar Envio & Compartilhar Redes */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs px-2 py-1.5 h-8 font-semibold shadow-md shadow-blue-600/20"
                      leftIcon={<Send className="h-3.5 w-3.5" />}
                      onClick={() => setDispatchingProduct(p)}
                    >
                      Registrar Envio
                    </Button>

                    <Button
                      size="sm"
                      className="text-xs px-2 py-1.5 h-8 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-600/20"
                      leftIcon={<Share2 className="h-3.5 w-3.5" />}
                      onClick={() => handleShareProduct(p)}
                      title="Compartilhar nas Redes Sociais"
                    >
                      Compartilhar
                    </Button>
                  </div>

                  {/* Linha 2: Ações Complementares — Editar, Histórico, Copiar, Ver, Excluir */}
                  <div className="grid grid-cols-5 gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-[10px] px-1 py-1 h-7 font-medium border border-blue-500/30 text-blue-300 hover:bg-blue-950/40"
                      leftIcon={<Edit2 className="h-3 w-3 text-blue-400" />}
                      onClick={() => setEditingProduct(p)}
                      title="Editar Informações do Produto"
                    >
                      Editar
                    </Button>

                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-[10px] px-1 py-1 h-7 font-medium"
                      leftIcon={<History className="h-3 w-3" />}
                      onClick={() => setHistoryProduct(p)}
                      title="Ver Histórico de Envios"
                    >
                      Histórico
                    </Button>

                    <Button
                      size="sm"
                      variant={isCopied ? 'success' : 'secondary'}
                      className="text-[10px] px-1 py-1 h-7 font-medium"
                      leftIcon={isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      onClick={() => handleCopyLink(p.id, targetUrl)}
                    >
                      {isCopied ? 'Copiado' : 'Copiar'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] px-1 py-1 h-7 font-medium"
                      leftIcon={<ExternalLink className="h-3 w-3" />}
                      onClick={() => window.open(targetUrl, '_blank')}
                    >
                      Ver
                    </Button>

                    <Button
                      size="sm"
                      variant="danger"
                      className="text-[10px] px-1 py-1 h-7 font-medium"
                      title="Mover para a Lixeira"
                      onClick={() => handleOpenTrashModal(p)}
                    >
                      <Trash2 className="h-3 w-3 mx-auto" />
                    </Button>
                  </div>
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
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedProductIds.includes(p.id))}
                      ref={(node) => {
                        if (node) {
                          const isAll = paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedProductIds.includes(p.id));
                          const isSome = paginatedProducts.some((p) => selectedProductIds.includes(p.id)) && !isAll;
                          node.indeterminate = isSome;
                        }
                      }}
                      onChange={() => toggleSelectAllVisible(paginatedProducts)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500 cursor-pointer"
                      title="Selecionar todos os produtos visíveis nesta página"
                    />
                  </th>
                  <th className="py-3.5 px-4">Oferta / Produto</th>
                  <th className="py-3.5 px-4">Categoria / Subcategoria</th>
                  <th className="py-3.5 px-4">Marketplace</th>
                  <th className="py-3.5 px-4">Preço</th>
                  <th className="py-3.5 px-4">Semáforo de Envio</th>
                  <th className="py-3.5 px-4">Total Envios</th>
                  <th className="py-3.5 px-4">Último Envio</th>
                  <th className="py-3.5 px-4 text-right">Ações de Divulgação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paginatedProducts.map((p) => {
                  const formattedPrice = p.currentPrice ? (p.currentPrice.formatBRL ? p.currentPrice.formatBRL() : `R$ ${p.currentPrice.amount}`) : 'R$ —';
                  const mainImg = p.images && p.images.length > 0 ? p.images[0] : undefined;
                  const isCopied = copiedId === p.id;
                  const targetUrl = p.affiliateUrl?.url || p.originalUrl;
                  const dispatchStatus = p.getDispatchStatus();

                  return (
                    <tr key={p.id} className={`transition ${selectedProductIds.includes(p.id) ? 'bg-blue-600/15' : 'hover:bg-slate-800/40'}`}>
                      <td className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={() => toggleSelectProduct(p.id)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
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
                        <button
                          type="button"
                          onClick={() => setCategoryModalProduct(p)}
                          className="hover:scale-105 transition"
                          title="Clique para editar a categoria"
                        >
                          {p.categorySource === 'AI' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                              🤖 {p.categoryId || 'Sem Categoria'} {p.categoryConfidence ? `· ${Math.round(p.categoryConfidence * 100)}%` : ''}
                            </span>
                          ) : p.categorySource === 'MANUAL' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                              👤 {p.categoryId || 'Sem Categoria'} {p.categoryLocked ? '🔒' : ''}
                            </span>
                          ) : p.categorySource === 'LEARNED' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              🧠 {p.categoryId || 'Sem Categoria'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                              🏷️ {p.categoryId || 'Sem Categoria'}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <MarketplaceBadge marketplaceSlug={p.marketplaceSlug} />
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {formattedPrice}
                      </td>
                      <td className="py-3 px-4">
                        <DispatchStatusBadge status={dispatchStatus} />
                      </td>
                      <td className="py-3 px-4 font-extrabold text-blue-400">
                        {p.dispatchCount || 0}x
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {p.lastDispatchedAt
                          ? `${new Date(p.lastDispatchedAt).toLocaleDateString('pt-BR')} ${new Date(p.lastDispatchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                          : 'Nunca'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs border border-blue-500/30 text-blue-300 hover:bg-blue-950/40"
                            leftIcon={<Edit2 className="h-3 w-3 text-blue-400" />}
                            onClick={() => setEditingProduct(p)}
                            title="Editar Informações do Produto"
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            leftIcon={<Share2 className="h-3 w-3" />}
                            onClick={() => handleShareProduct(p)}
                            title="Compartilhar nas Redes Sociais"
                          >
                            Compartilhar
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs"
                            leftIcon={<Send className="h-3 w-3" />}
                            onClick={() => setDispatchingProduct(p)}
                          >
                            Registrar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs"
                            onClick={() => setHistoryProduct(p)}
                          >
                            Histórico
                          </Button>
                          <Button
                            size="sm"
                            variant={isCopied ? 'success' : 'outline'}
                            className="text-xs"
                            onClick={() => handleCopyLink(p.id, targetUrl)}
                          >
                            {isCopied ? 'Copiado' : 'Link'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="text-xs px-2 py-1"
                            title="Mover para a Lixeira"
                            leftIcon={<Trash2 className="h-3 w-3" />}
                            onClick={() => handleOpenTrashModal(p)}
                          >
                            Excluir
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
            Exibindo {paginatedProducts.length} de {filteredProducts.length} ofertas
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

      {/* ── Modal Registrar Envio de Oferta ──────────────────────────────────── */}
      {dispatchingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-slate-900 border-slate-800 animate-in fade-in zoom-in-95 duration-150 rounded-2xl shadow-2xl">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                    <Send className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-base text-white">Registrar Envio de Oferta</CardTitle>
                </div>
                <button onClick={() => setDispatchingProduct(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription className="text-xs mt-1 text-slate-300 font-semibold">{dispatchingProduct.title}</CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4 text-xs">
              {/* Alert Banner if sent recently (<3 days) */}
              {dispatchingProduct.getDispatchStatus() === 'ENVIADA_RECENTEMENTE' && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs text-red-200">⚠️ Aviso de Reenvio Recente</strong>
                    <span>
                      Esta oferta foi divulgada recentemente ({dispatchingProduct.lastDispatchedAt ? new Date(dispatchingProduct.lastDispatchedAt).toLocaleDateString('pt-BR') : 'há poucos dias'}) no canal {dispatchingProduct.lastChannel || 'anterior'}. Evite enviar a mesma oferta repetidamente sem intervalo suficiente.
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleRecordDispatchSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-300 block text-xs">Canal de Divulgação</label>
                    <button
                      type="button"
                      onClick={() => setIsOptionsManagerOpen(true)}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                    >
                      <Settings className="h-3 w-3" /> Gerenciar opções
                    </button>
                  </div>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {dispatchChannels
                      .filter((c) => c.active)
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-300 block text-xs">Grupo / Lista de Destino</label>
                    <button
                      type="button"
                      onClick={() => setIsOptionsManagerOpen(true)}
                      className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                    >
                      <Settings className="h-3 w-3" /> Gerenciar opções
                    </button>
                  </div>
                  <select
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Selecione uma lista/grupo --</option>
                    {targetGroups
                      .filter((g) => g.active)
                      .map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.name} {g.description ? `(${g.description})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Modo de Envio</label>
                    <select
                      value={dispatchType}
                      onChange={(e) => setDispatchType(e.target.value as 'MANUAL' | 'AUTOMATIC')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="MANUAL">Envio Manual</option>
                      <option value="AUTOMATIC">Automático / Bot</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Registrado por</label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || user?.email || 'Admin'}
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Observação / Nota de Desempenho (Opcional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Bom engajamento de cliques no horário do almoço..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button type="button" variant="outline" size="sm" onClick={() => setDispatchingProduct(null)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={processing}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    {processing ? 'Registrando...' : 'Confirmar Envio'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Modal Histórico Completo de Divulgação ───────────────────────────── */}
      {historyProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 bg-slate-900 border-slate-800 animate-in fade-in zoom-in-95 duration-150 rounded-2xl shadow-2xl">
            <CardHeader className="p-0 mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-white">Histórico Completo de Divulgação</CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Registro contínuo e inalterável de campanhas enviadas.
                    </CardDescription>
                  </div>
                </div>
                <button onClick={() => setHistoryProduct(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-slate-300 font-bold mt-2 truncate">{historyProduct.title}</p>
            </CardHeader>

            <CardContent className="p-0 space-y-4 text-xs max-h-[420px] overflow-y-auto pr-1">
              {!historyProduct.dispatchHistory || historyProduct.dispatchHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <Send className="h-8 w-8 mx-auto text-slate-600" />
                  <p className="text-xs">Esta oferta ainda não possui envios registrados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyProduct.dispatchHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span className="text-blue-400">📢 {item.channel}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300">{item.targetGroup || 'Grupo Geral'}</span>
                        </div>

                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400">
                          {item.type === 'AUTOMATIC' ? '🤖 Automático' : '👤 Envio Manual'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>Data: {new Date(item.dispatchedAt).toLocaleString('pt-BR')}</span>
                        <span>Operador: {item.sentBy || 'Admin'}</span>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 mt-1">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setHistoryProduct(null)}>
                  Fechar Histórico
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Modal Mover para Lixeira ───────────────────────────────────────── */}
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

      {/* ── Modal Compartilhar nas Redes Sociais ───────────────────────────────── */}
      {shareModalData && (
        <SocialShareModal data={shareModalData} onClose={() => setShareModalData(null)} />
      )}
        </div>
      )}

      {/* ── Categorization Modals ────────────────────────────────────────────── */}
      <CategorySelectorModal
        product={categoryModalProduct}
        categories={categories}
        isOpen={Boolean(categoryModalProduct)}
        onClose={() => setCategoryModalProduct(null)}
        onSuccess={(updated) => {
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setSuccessMsg(`Categoria do produto "${updated.title}" atualizada com sucesso!`);
          setTimeout(() => setSuccessMsg(null), 3000);
        }}
      />

      <BulkCategoryModal
        selectedProducts={products.filter((p) => selectedProductIds.includes(p.id))}
        categories={categories}
        isOpen={isBulkCategoryModalOpen}
        onClose={() => setIsBulkCategoryModalOpen(false)}
        onSuccess={(count) => {
          setSuccessMsg(`Categoria atualizada com sucesso para ${count} produtos!`);
          loadProducts();
          setSelectedProductIds([]);
          setTimeout(() => setSuccessMsg(null), 3000);
        }}
      />

      <BulkDeleteModal
        selectedProducts={products.filter((p) => selectedProductIds.includes(p.id))}
        offersMap={offersMap}
        userId={user?.uid || ''}
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onSuccess={(count) => {
          setSuccessMsg(`${count} produtos movidos para a Lixeira inteligente.`);
          loadProducts();
          setSelectedProductIds([]);
          setTimeout(() => setSuccessMsg(null), 3000);
        }}
      />

      <DispatchOptionsManagerModal
        channels={dispatchChannels}
        groups={targetGroups}
        products={products}
        isOpen={isOptionsManagerOpen}
        onClose={() => setIsOptionsManagerOpen(false)}
        onRefresh={loadDispatchOptions}
      />

      <EditProductModal
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onSuccess={() => {
          setSuccessMsg('Produto atualizado com sucesso no catálogo!');
          loadProducts();
          setTimeout(() => setSuccessMsg(null), 3000);
        }}
      />

      <MagaluDiscoveryModal
        isOpen={isMagaluDiscoveryOpen}
        onClose={() => setIsMagaluDiscoveryOpen(false)}
        onSuccess={() => {
          setSuccessMsg('Ofertas do Magalu descobertas e importadas com sucesso!');
          loadProducts();
          setTimeout(() => setSuccessMsg(null), 3000);
        }}
      />
    </div>
  );
}
