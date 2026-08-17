'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { X, Edit3, Package, Tag, DollarSign, PlusCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { Product, ProductMedia, OFFICIAL_TAXONOMY_CATEGORIES } from '@/core/domain/entities/product.entity';
import { Offer } from '@/core/domain/entities/offer.entity';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { UpdateProductUseCase } from '@/core/application/use-cases/products/UpdateProductUseCase';
import { UpdateOfferUseCase } from '@/core/application/use-cases/offers/UpdateOfferUseCase';
import { CustomTaxonomyService } from '@/core/domain/services/CustomTaxonomyService';
import { Price } from '@/core/domain/value-objects/price.vo';
import { useAuth } from '@/presentation/context/AuthContext';
import { ProductMediaGalleryManager } from './ProductMediaGalleryManager';

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_MARKETPLACE_OPTIONS = [
  { slug: 'shopee', name: 'Shopee' },
  { slug: 'magalu', name: 'Magazine Luiza (Magalu)' },
  { slug: 'mercadolivre', name: 'Mercado Livre' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'shein', name: 'SHEIN' },
  { slug: 'geral', name: 'Geral / Outro' },
];

export function EditProductModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currentPriceAmount, setCurrentPriceAmount] = useState('');
  const [previousPriceAmount, setPreviousPriceAmount] = useState('');
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [processing, setProcessing] = useState(false);

  // Oferta Vinculada & Marketplace da Oferta Comercial
  const [linkedOffer, setLinkedOffer] = useState<Offer | null>(null);
  const [marketplaceSlug, setMarketplaceSlug] = useState('shopee');
  const [marketplaceName, setMarketplaceName] = useState('Shopee');

  // Taxonomias & Modais Inline
  const [marketplaceOptions, setMarketplaceOptions] = useState(DEFAULT_MARKETPLACE_OPTIONS);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(OFFICIAL_TAXONOMY_CATEGORIES);

  const [showNewMarketplaceModal, setShowNewMarketplaceModal] = useState(false);
  const [newMarketplaceName, setNewMarketplaceName] = useState('');
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');
  const [creatingTaxonomy, setCreatingTaxonomy] = useState(false);

  const taxonomyService = useRef(new CustomTaxonomyService()).current;

  // Carrega taxonomias customizadas salvas no Firestore para o usuário
  useEffect(() => {
    if (user?.uid) {
      taxonomyService.getCustomMarketplaces(user.uid).then((customMkts) => {
        if (customMkts && customMkts.length > 0) {
          const formatted = customMkts.map((m) => ({ slug: m.slug, name: m.name }));
          setMarketplaceOptions((prev) => {
            const existingSlugs = prev.map((p) => p.slug);
            const toAdd = formatted.filter((f) => !existingSlugs.includes(f.slug));
            return [...prev, ...toAdd];
          });
        }
      });

      taxonomyService.getCustomCategories(user.uid).then((customCats) => {
        if (customCats && customCats.length > 0) {
          const names = customCats.map((c) => c.name);
          setCategoryOptions((prev) => Array.from(new Set([...prev, ...names])));
        }
      });
    }
  }, [user?.uid]);

  useEffect(() => {
    if (product && isOpen && user?.uid) {
      setTitle(product.title || '');
      setDescription(product.description || '');
      setBrand(product.brand || '');
      setCategoryId(product.categoryId || 'Geral');

      // Formatação Monetária BRL Automática na Inicialização
      setCurrentPriceAmount(product.currentPrice ? Price.formatBRL(product.currentPrice.amount) : 'R$ 0,00');
      setPreviousPriceAmount(product.previousPrice ? Price.formatBRL(product.previousPrice.amount) : '');
      setMedia(product.media || []);

      const initialMkt = product.marketplaceSlug || 'shopee';
      setMarketplaceSlug(initialMkt);
      setMarketplaceName(DEFAULT_MARKETPLACE_OPTIONS.find((m) => m.slug === initialMkt)?.name || 'Shopee');

      // Carrega a oferta vinculada no Firestore para permitir editar o Marketplace da Offer
      const offerRepo = new FirestoreOfferRepository();
      offerRepo.findByProductId(product.id, user.uid).then((offers) => {
        if (offers && offers.length > 0) {
          const mainOffer = offers[0];
          setLinkedOffer(mainOffer);
          const offerMkt = mainOffer.marketplaceId || initialMkt;
          setMarketplaceSlug(offerMkt);
          setMarketplaceName(mainOffer.marketplaceName || DEFAULT_MARKETPLACE_OPTIONS.find((m) => m.slug === offerMkt)?.name || 'Shopee');
        }
      }).catch((err) => {
        console.warn('[EditProductModal] Erro ao carregar oferta vinculada:', err);
      });
    }
  }, [product, isOpen, user?.uid]);

  if (!isOpen || !product) return null;

  // Criação Inline de Novo Marketplace no Firestore
  const handleCreateMarketplace = async () => {
    if (!newMarketplaceName.trim() || !user?.uid || creatingTaxonomy) return;

    setCreatingTaxonomy(true);
    try {
      const created = await taxonomyService.createCustomMarketplace(
        newMarketplaceName,
        newMarketplaceName,
        user.uid
      );

      setMarketplaceOptions((prev) => {
        if (!prev.some((m) => m.slug === created.slug)) {
          return [...prev, { slug: created.slug, name: created.name }];
        }
        return prev;
      });

      setMarketplaceSlug(created.slug);
      setMarketplaceName(created.name);
      setNewMarketplaceName('');
      setShowNewMarketplaceModal(false);
    } catch (err: any) {
      alert(`Não foi possível criar o marketplace: ${err?.message || String(err)}`);
    } finally {
      setCreatingTaxonomy(false);
    }
  };

  // Criação Inline de Nova Categoria no Firestore
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user?.uid || creatingTaxonomy) return;

    setCreatingTaxonomy(true);
    try {
      const created = await taxonomyService.createCustomCategory(
        newCategoryName,
        newCategoryParent || null,
        user.uid
      );

      setCategoryOptions((prev) => {
        if (!prev.includes(created.name)) {
          return [...prev, created.name];
        }
        return prev;
      });

      setCategoryId(created.name);
      setNewCategoryName('');
      setNewCategoryParent('');
      setShowNewCategoryModal(false);
    } catch (err: any) {
      alert(`Não foi possível criar a categoria: ${err?.message || String(err)}`);
    } finally {
      setCreatingTaxonomy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || processing) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert('O título do produto é obrigatório.');
      return;
    }

    // Validação e Parse BRL Seguro dos Preços
    const priceNum = Price.parseBRL(currentPriceAmount);
    if (priceNum <= 0) {
      alert('Informe um preço atual válido maior que zero.');
      return;
    }

    const prevPriceNum = previousPriceAmount.trim() ? Price.parseBRL(previousPriceAmount) : null;

    setProcessing(true);
    try {
      const productRepo = new FirestoreProductRepository();
      const offerRepo = new FirestoreOfferRepository();

      const updateProductUseCase = new UpdateProductUseCase(productRepo);
      const updateOfferUseCase = new UpdateOfferUseCase(offerRepo);

      const imagesList = media.filter((m) => m.type === 'image').map((m) => m.url);

      // 1. Atualização do Produto (Product) no Firestore
      const productChanges: Partial<Product> = {
        title: trimmedTitle,
        description: description.trim(),
        brand: brand.trim(),
        categoryId: categoryId.trim() || 'Geral',
        currentPrice: Price.create(priceNum),
        previousPrice: prevPriceNum !== null && prevPriceNum > 0 ? Price.create(prevPriceNum) : null,
        images: imagesList.length > 0 ? imagesList : product.images,
        media,
      };

      await updateProductUseCase.execute({
        productId: product.id,
        userId: user.uid,
        changes: productChanges,
      });

      // 2. Atualização do Marketplace na Offer Vinculada (Mantendo offer.id e product.id)
      if (linkedOffer) {
        const selectedMkt = marketplaceOptions.find((m) => m.slug === marketplaceSlug);
        const finalMktName = selectedMkt ? selectedMkt.name : marketplaceName.trim();

        await updateOfferUseCase.execute({
          offerId: linkedOffer.id,
          userId: user.uid,
          changes: {
            marketplaceId: marketplaceSlug,
            marketplaceName: finalMktName,
          },
        });
      }

      console.log('[EditProductModal] Produto e Oferta atualizados com sucesso. ProductID:', product.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[EditProductModal] Erro ao atualizar produto:', err);
      const errMsg = err?.message || String(err);
      alert(`Não foi possível salvar as alterações do produto: ${errMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn text-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Editar Produto (Catálogo)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product ID & Editable Marketplace (Pertence à Offer) */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
          <span>
            ID do Produto: <strong className="font-mono text-blue-400">{product.id}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-semibold text-slate-300">Marketplace da Oferta:</span>
            <select
              value={marketplaceSlug}
              onChange={(e) => {
                const slug = e.target.value;
                if (slug === 'NEW') {
                  setShowNewMarketplaceModal(true);
                } else {
                  setMarketplaceSlug(slug);
                  const opt = marketplaceOptions.find((m) => m.slug === slug);
                  if (opt) setMarketplaceName(opt.name);
                }
              }}
              className="bg-slate-900 border border-slate-700 text-amber-400 font-bold px-2 py-1 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            >
              {marketplaceOptions.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
              <option value="NEW">➕ Criar Novo Marketplace...</option>
            </select>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título do Produto <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Fone de Ouvido Bluetooth Sem Fio"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição Factual do Produto</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes e especificações do produto..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Grid de Marca e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-blue-400" /> Marca
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Xiaomi, Samsung, Eudora"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-blue-400" /> Categoria (Catálogo)
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(true)}
                  className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <PlusCircle className="h-3 w-3" /> Criar Nova
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500 transition"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid de Preços com Formatação Monetária BRL Automática */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Preço Atual (R$) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={currentPriceAmount}
                onChange={(e) => setCurrentPriceAmount(e.target.value)}
                onBlur={() => setCurrentPriceAmount(Price.formatBRL(Price.parseBRL(currentPriceAmount)))}
                placeholder="R$ 0,00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold font-mono focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-slate-400" /> Preço Anterior (R$) (Opcional)
              </label>
              <input
                type="text"
                value={previousPriceAmount}
                onChange={(e) => setPreviousPriceAmount(e.target.value)}
                onBlur={() => setPreviousPriceAmount(previousPriceAmount.trim() ? Price.formatBRL(Price.parseBRL(previousPriceAmount)) : '')}
                placeholder="R$ 0,00 (Deixe em branco se não houver)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono focus:outline-none focus:border-slate-500 transition"
              />
            </div>
          </div>

          {/* Galeria de Mídias (Imagens e Vídeos) */}
          <ProductMediaGalleryManager media={media} onChange={setMedia} />

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={processing}
              leftIcon={processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            >
              {processing ? 'Salvando Alterações...' : 'Salvar Produto'}
            </Button>
          </div>
        </form>

        {/* MODAL INLINE DE CRIAÇÃO DE NOVO MARKETPLACE */}
        {showNewMarketplaceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-amber-400" />
                  <span>Criar Novo Marketplace Oficial</span>
                </h3>
                <button onClick={() => setShowNewMarketplaceModal(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome do Marketplace:</label>
                <input
                  type="text"
                  value={newMarketplaceName}
                  onChange={(e) => setNewMarketplaceName(e.target.value)}
                  placeholder="Ex: Kwai Shop, AliExpress"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowNewMarketplaceModal(false)} disabled={creatingTaxonomy}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateMarketplace}
                  disabled={creatingTaxonomy || !newMarketplaceName.trim()}
                  leftIcon={creatingTaxonomy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                >
                  {creatingTaxonomy ? 'Criando...' : 'Criar e Selecionar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL INLINE DE CRIAÇÃO DE NOVA CATEGORIA */}
        {showNewCategoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-blue-400" />
                  <span>Criar Nova Categoria Oficial</span>
                </h3>
                <button onClick={() => setShowNewCategoryModal(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome da Categoria:</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Maquiagem, Smartwatches"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria Pai (Opcional):</label>
                  <select
                    value={newCategoryParent}
                    onChange={(e) => setNewCategoryParent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Sem Categoria Pai (Principal)</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowNewCategoryModal(false)} disabled={creatingTaxonomy}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateCategory}
                  disabled={creatingTaxonomy || !newCategoryName.trim()}
                  leftIcon={creatingTaxonomy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                >
                  {creatingTaxonomy ? 'Criando...' : 'Criar e Selecionar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
