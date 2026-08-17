'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { X, Tag, Sparkles, MessageSquare, Flame, Check, Link as LinkIcon, Image as ImageIcon, FileText, Upload, Trash2, RefreshCw, Video, AlertCircle, PlusCircle } from 'lucide-react';
import { Offer } from '@/core/domain/entities/offer.entity';
import { Product, ProductMedia, OFFICIAL_TAXONOMY_CATEGORIES } from '@/core/domain/entities/product.entity';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirebaseStorageService } from '@/infrastructure/firebase/storage/firebase-storage.service';
import { CustomTaxonomyService, CustomMarketplace, CustomCategory } from '@/core/domain/services/CustomTaxonomyService';
import { UpdateOfferUseCase } from '@/core/application/use-cases/offers/UpdateOfferUseCase';
import { ScoreType } from '@/core/domain/value-objects/score-level.vo';
import { Price, AffiliateLink } from '@/core/domain/value-objects';
import { useAuth } from '@/presentation/context/AuthContext';
import { ProductIdentityResolver } from '@/core/domain/services/ProductIdentityResolver';

interface EditOfferModalProps {
  offer: Offer | null;
  productTitle?: string;
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

export function EditOfferModal({
  offer,
  productTitle,
  isOpen,
  onClose,
  onSuccess,
}: EditOfferModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'product' | 'offer'>('product');
  const [product, setProduct] = useState<Product | null>(null);

  // Campos do Produto Vinculado
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currentPriceStr, setCurrentPriceStr] = useState('');
  const [previousPriceStr, setPreviousPriceStr] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaList, setMediaList] = useState<ProductMedia[]>([]);
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);
  const [category, setCategory] = useState('Geral');

  // Taxonomy & Options
  const [marketplaceOptions, setMarketplaceOptions] = useState(DEFAULT_MARKETPLACE_OPTIONS);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(OFFICIAL_TAXONOMY_CATEGORIES);

  // Modais Inline de Criação de Marketplace e Categoria
  const [showNewMarketplaceModal, setShowNewMarketplaceModal] = useState(false);
  const [newMarketplaceName, setNewMarketplaceName] = useState('');
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');
  const [creatingTaxonomy, setCreatingTaxonomy] = useState(false);

  // Inputs para Mídia por Link (URL Externa)
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Campos da Oferta Comercial
  const [marketplaceSlug, setMarketplaceSlug] = useState('shopee');
  const [marketplaceName, setMarketplaceName] = useState('');
  const [whatsAppCopy, setWhatsAppCopy] = useState('');
  const [scoreValue, setScoreValue] = useState('90');
  const [scoreLabel, setScoreLabel] = useState<ScoreType>('EXCELLENT');
  const [scoreJustification, setScoreJustification] = useState('');
  const [cta, setCta] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const storageService = useRef(new FirebaseStorageService()).current;
  const taxonomyService = useRef(new CustomTaxonomyService()).current;
  const identityResolver = useRef(new ProductIdentityResolver()).current;

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
    if (offer && isOpen && user?.uid) {
      const slug = offer.marketplaceId || (offer as any).marketplace || 'shopee';
      setMarketplaceSlug(slug);
      setMarketplaceName(offer.marketplaceName || marketplaceOptions.find(m => m.slug === slug)?.name || 'Shopee');

      const existingText = offer.copies?.copies?.whatsAppText ||
        offer.copies?.copies?.shortText ||
        (typeof offer.copies === 'string' ? offer.copies : '');
      setWhatsAppCopy(existingText);
      setScoreValue(offer.scoreValue !== undefined ? String(offer.scoreValue) : '90');
      setScoreLabel(offer.scoreLabel || 'EXCELLENT');
      setScoreJustification(offer.scoreJustification || '');
      setCta(offer.cta || '🔥 Garanta o seu antes que acabe!');
      setHashtags(offer.hashtags ? offer.hashtags.join(', ') : '');

      if (offer.media && offer.media.length > 0) {
        setMediaList(offer.media);
      }

      // Carrega o produto vinculado no Firestore para permitir edição integral
      if (offer.productId) {
        const productRepo = new FirestoreProductRepository();
        productRepo.findById(offer.productId).then((p) => {
          if (p) {
            setProduct(p);
            setTitle(p.title || productTitle || '');
            setDescription(p.description || '');
            setCurrentPriceStr(p.currentPrice ? Price.formatBRL(p.currentPrice.amount) : 'R$ 0,00');
            setPreviousPriceStr(p.previousPrice ? Price.formatBRL(p.previousPrice.amount) : '');
            setOriginalUrl(p.originalUrl || '');
            setAffiliateUrl(p.affiliateUrl ? p.affiliateUrl.url : p.originalUrl || '');
            setImageUrl(p.images && p.images.length > 0 ? p.images[0] : '');
            if ((!offer.media || offer.media.length === 0) && p.media && p.media.length > 0) {
              setMediaList(p.media);
            }
            setCategory(p.categoryId || 'Geral');
          } else {
            setTitle(productTitle || '');
          }
        }).catch((err) => {
          console.warn('[EditOfferModal] Erro ao carregar produto vinculado:', err);
          setTitle(productTitle || '');
        });
      } else {
        setTitle(productTitle || '');
      }
    }
  }, [offer, isOpen, user?.uid, productTitle]);

  if (!isOpen || !offer) return null;

  // Lógica de upload de imagem/vídeo local para Firebase Storage
  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, acceptedType: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const newItems: ProductMedia[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const nextOrder = mediaList.length + newItems.length;
        const isFirst = nextOrder === 0;

        const mediaItem = await storageService.uploadOfferMediaFile(
          file,
          offer.id,
          nextOrder,
          isFirst
        );
        newItems.push(mediaItem);
      }

      setMediaList((prev) => {
        const updated = [...prev, ...newItems];
        if (!updated.some((m) => m.isPrimary) && updated.length > 0) {
          updated[0].isPrimary = true;
        }
        return updated;
      });

      const primary = newItems.find((m) => m.isPrimary) || newItems[0];
      if (primary && primary.type === 'image') {
        setImageUrl(primary.url);
      }
    } catch (err: any) {
      console.error('[EditOfferModal] Falha no upload da mídia:', err);
      alert(`Falha ao fazer upload da mídia: ${err?.message || String(err)}`);
    } finally {
      setUploadingImage(false);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  // Adicionar Mídia por URL (Imagem ou Vídeo) na Edição
  const handleAddUrlMedia = (mediaType: 'image' | 'video') => {
    const rawUrl = mediaType === 'video' ? videoUrlInput : imageUrlInput;
    if (!rawUrl.trim()) {
      alert('Por favor, informe uma URL válida.');
      return;
    }

    try {
      const nextOrder = mediaList.length;
      const isFirst = nextOrder === 0;
      const mediaItem = storageService.buildUrlMedia(rawUrl, mediaType, nextOrder, isFirst);

      setMediaList((prev) => {
        const updated = [...prev, mediaItem];
        if (!updated.some((m) => m.isPrimary) && updated.length > 0) {
          updated[0].isPrimary = true;
        }
        return updated;
      });

      if (mediaType === 'video') {
        setVideoUrlInput('');
        setShowVideoUrlInput(false);
      } else {
        setImageUrlInput('');
        setShowImageUrlInput(false);
      }
    } catch (err: any) {
      alert(err?.message || 'URL inválida.');
    }
  };

  const handleRemoveMediaItem = async (mediaId: string, url: string) => {
    if (confirm('Deseja remover esta mídia da oferta?')) {
      setMediaList((prev) => {
        const filtered = prev.filter((m) => m.id !== mediaId);
        if (!filtered.some((m) => m.isPrimary) && filtered.length > 0) {
          filtered[0].isPrimary = true;
        }
        return filtered;
      });
      setFailedImageIds((prev) => prev.filter((id) => id !== mediaId));

      await storageService.deleteStorageImage(url);
    }
  };

  const handleSetPrimaryMediaItem = (mediaId: string) => {
    setMediaList((prev) =>
      prev.map((m) => ({
        ...m,
        isPrimary: m.id === mediaId,
      }))
    );

    const selected = mediaList.find((m) => m.id === mediaId);
    if (selected && selected.type === 'image') {
      setImageUrl(selected.url);
    }
  };

  // Alternância de Marketplace na Oferta com auto-regeneração oficial
  const handleMarketplaceChange = (newSlug: string) => {
    setMarketplaceSlug(newSlug);
    const opt = marketplaceOptions.find((m) => m.slug === newSlug);
    if (opt) setMarketplaceName(opt.name);

    if (originalUrl.trim()) {
      try {
        const resolved = identityResolver.resolveCanonicalKey(originalUrl.trim());
        if (resolved && resolved.marketplaceSlug === newSlug) {
          // Se a URL original corresponder ao novo marketplace, preserva a URL
        }
      } catch {
        // Ignora
      }
    }
  };

  // Criação Inline de Novo Marketplace
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

  // Criação Inline de Nova Categoria
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

      setCategory(created.name);
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

    setProcessing(true);
    try {
      const offerRepo = new FirestoreOfferRepository();
      const productRepo = new FirestoreProductRepository();
      const useCase = new UpdateOfferUseCase(offerRepo);

      // Parse BRL dos preços digitados (Garante valor numérico correto)
      const validPrice = Price.parseBRL(currentPriceStr);
      const validPrevPrice = previousPriceStr.trim() ? Price.parseBRL(previousPriceStr) : null;

      // 1. Atualiza o Product vinculado no Firestore se ele existir
      if (product) {
        const primaryMedia = mediaList.find((m) => m.isPrimary) || mediaList[0];
        const primaryUrl = primaryMedia ? primaryMedia.url : imageUrl.trim();

        const updatedImages = primaryUrl
          ? [primaryUrl, ...(product.images || []).filter((img) => img !== primaryUrl)]
          : product.images;

        product.title = title.trim() || product.title;
        product.description = description.trim();
        product.currentPrice = Price.create(validPrice);
        if (validPrevPrice !== null && validPrevPrice > 0) {
          product.previousPrice = Price.create(validPrevPrice);
        } else {
          product.previousPrice = null; // Preserva campo opcional se não houver preço anterior
        }

        (product as any).originalUrl = originalUrl.trim() || product.originalUrl;
        product.affiliateUrl = AffiliateLink.create(affiliateUrl.trim() || originalUrl.trim() || product.originalUrl);
        product.images = updatedImages;
        product.categoryId = category.trim() || product.categoryId;
        product.media = mediaList;

        await productRepo.save(product);
      }

      // 2. Atualiza a Offer no Firestore com marketplaceId e media mantendo o offer.id original
      const scoreNum = parseInt(scoreValue, 10);
      const selectedMarketplaceObj = marketplaceOptions.find((m) => m.slug === marketplaceSlug);
      const finalMarketplaceName = selectedMarketplaceObj ? selectedMarketplaceObj.name : marketplaceName.trim();

      const hashtagList = hashtags
        .split(',')
        .map((h) => h.trim().replace(/^#/, ''))
        .filter(Boolean);

      const existingCopies = offer.copies?.copies || {};

      const changes: Partial<Offer> = {
        marketplaceId: marketplaceSlug,
        marketplaceName: finalMarketplaceName,
        scoreValue: !isNaN(scoreNum) ? scoreNum : offer.scoreValue,
        scoreLabel,
        scoreJustification: scoreJustification.trim(),
        cta: cta.trim(),
        hashtags: hashtagList,
        media: mediaList,
        copies: {
          ...offer.copies,
          copies: {
            ...existingCopies,
            whatsAppText: whatsAppCopy.trim(),
          },
        } as any,
      };

      await useCase.execute({
        offerId: offer.id,
        userId: user.uid,
        changes,
      });

      console.log('[EditOfferModal] Oferta e Produto atualizados com sucesso. OfferID:', offer.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[EditOfferModal] Erro ao salvar alterações:', err);
      const errMsg = err?.message || String(err);
      alert(`Não foi possível salvar as alterações da oferta: ${errMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn text-xs">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 p-4">
          <div>
            <h3 className="font-bold text-white text-base">Editar Oferta & Produto</h3>
            <p className="text-xs text-slate-400">Edição integral dos dados da oferta e produto vinculado.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('product')}
            className={`flex-1 py-3 font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'product'
                ? 'border-b-2 border-blue-500 text-blue-400 bg-blue-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="h-3.5 w-3.5" /> Produto (Catálogo & Mídias)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('offer')}
            className={`flex-1 py-3 font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'offer'
                ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Oferta Comercial & Marketplace
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === 'product' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título do Produto:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Preços com Formatação Monetária BRL Automática */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preço Atual (R$):</label>
                  <input
                    type="text"
                    value={currentPriceStr}
                    onChange={(e) => setCurrentPriceStr(e.target.value)}
                    onBlur={() => setCurrentPriceStr(Price.formatBRL(Price.parseBRL(currentPriceStr)))}
                    placeholder="R$ 0,00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preço Anterior (Opcional - R$):</label>
                  <input
                    type="text"
                    value={previousPriceStr}
                    onChange={(e) => setPreviousPriceStr(e.target.value)}
                    onBlur={() => setPreviousPriceStr(previousPriceStr.trim() ? Price.formatBRL(Price.parseBRL(previousPriceStr)) : '')}
                    placeholder="R$ 0,00 (Deixe em branco se não houver)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-400 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <LinkIcon className="h-3.5 w-3.5 text-blue-400" /> Link Original do Produto:
                  </label>
                  <input
                    type="text"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-blue-300 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <LinkIcon className="h-3.5 w-3.5 text-emerald-400" /> Link de Afiliado:
                  </label>
                  <input
                    type="text"
                    value={affiliateUrl}
                    onChange={(e) => setAffiliateUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-300 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Categoria do Produto (Taxonomia Oficial Selecionável) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Categoria do Produto (Catálogo):</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryModal(true)}
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <PlusCircle className="h-3 w-3" /> Criar Nova Categoria
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mídias da Oferta (Fotos e Vídeos - Arquivo ou Link) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-purple-400" /> Mídias da Oferta (Imagens & Vídeos):
                  </label>
                  <span className="text-[10px] text-slate-400">{mediaList.length} mídia(s)</span>
                </div>

                {/* Opções Duplas de Mídia: PC vs Link URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleMediaFileUpload(e, 'image')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage}
                      onClick={() => imageFileInputRef.current?.click()}
                      className="text-xs justify-center"
                      leftIcon={uploadingImage ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-purple-400" />}
                    >
                      📁 Imagem do PC
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3 text-blue-400" /> Usar Link da Imagem
                    </button>
                    {showImageUrlInput && (
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="https://.../imagem.jpg"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono text-[10px]"
                        />
                        <Button type="button" variant="primary" size="sm" onClick={() => handleAddUrlMedia('image')}>
                          OK
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={(e) => handleMediaFileUpload(e, 'video')}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage}
                      onClick={() => videoFileInputRef.current?.click()}
                      className="text-xs justify-center"
                      leftIcon={uploadingImage ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-blue-400" />}
                    >
                      📁 Vídeo do PC
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowVideoUrlInput(!showVideoUrlInput)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center justify-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3 text-blue-400" /> Usar Link do Vídeo
                    </button>
                    {showVideoUrlInput && (
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          placeholder="https://.../video.mp4"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white font-mono text-[10px]"
                        />
                        <Button type="button" variant="primary" size="sm" onClick={() => handleAddUrlMedia('video')}>
                          OK
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid de Mídias Anexadas */}
                {mediaList.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {mediaList.map((m) => {
                      const hasFailed = failedImageIds.includes(m.id);

                      return (
                        <div key={m.id} className={`relative rounded-xl border p-1.5 bg-slate-950 flex flex-col gap-1.5 ${m.isPrimary ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-slate-800'}`}>
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                            {m.type === 'video' ? (
                              <video src={m.url} controls className="w-full h-full object-cover" />
                            ) : hasFailed ? (
                              <div className="flex flex-col items-center justify-center p-2 text-center text-amber-400">
                                <AlertCircle className="h-5 w-5 mb-1" />
                                <span className="text-[9px]">URL Externa Carregada</span>
                              </div>
                            ) : (
                              <img
                                src={m.url}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                onError={() => {
                                  setFailedImageIds((prev) => [...prev, m.id]);
                                }}
                              />
                            )}

                            {m.isPrimary && (
                              <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-bold px-1 rounded flex items-center gap-0.5 z-10">
                                ★ Capa
                              </span>
                            )}

                            <span className="absolute bottom-1 right-1 bg-slate-950/80 text-white text-[9px] px-1 rounded flex items-center gap-0.5 z-10">
                              {m.type === 'video' ? <Video className="h-3 w-3 text-blue-400" /> : <ImageIcon className="h-3 w-3 text-purple-400" />}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            {!m.isPrimary && m.type === 'image' && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryMediaItem(m.id)}
                                className="text-amber-400 hover:underline font-semibold"
                              >
                                Marcar Capa
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMediaItem(m.id, m.url)}
                              className="text-red-400 hover:text-red-300 p-0.5 ml-auto"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 bg-slate-950 border border-dashed border-slate-800 rounded-xl p-3 text-center">
                    Nenhuma mídia anexada a esta oferta ainda.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Descrição Factual / Briefing do Produto (Fonte da Verdade):
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Insira detalhes técnicos, voltagem, recursos e características..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'offer' && (
            <div className="space-y-4">
              {/* Marketplace da Oferta Comercial */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Marketplace da Oferta (Origem Comercial):</label>
                  <button
                    type="button"
                    onClick={() => setShowNewMarketplaceModal(true)}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                  >
                    <PlusCircle className="h-3 w-3" /> Criar Novo Marketplace
                  </button>
                </div>
                <select
                  value={marketplaceSlug}
                  onChange={(e) => handleMarketplaceChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-amber-500"
                >
                  {marketplaceOptions.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-amber-400" /> Texto de Divulgação (Copy WhatsApp):
                </label>
                <textarea
                  rows={6}
                  value={whatsAppCopy}
                  onChange={(e) => setWhatsAppCopy(e.target.value)}
                  placeholder="Insira a Copy promocional final para envio nos grupos..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-500" /> Score de Atratividade (0-100):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scoreValue}
                    onChange={(e) => setScoreValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Classificação do Score:</label>
                  <select
                    value={scoreLabel}
                    onChange={(e) => setScoreLabel(e.target.value as ScoreType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="EXCELLENT">EXCELLENT (Excelente)</option>
                    <option value="GOOD">GOOD (Boa)</option>
                    <option value="FAIR">FAIR (Regular)</option>
                    <option value="POOR">POOR (Fraca)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Justificativa da Nota / IA:</label>
                <input
                  type="text"
                  value={scoreJustification}
                  onChange={(e) => setScoreJustification(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Chamada para Ação (CTA):</label>
                <input
                  type="text"
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Hashtags (separadas por vírgula):</label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="promo, oferta, desconto"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={processing}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={processing}
              leftIcon={processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            >
              {processing ? 'Salvando Alterações...' : 'Salvar Alterações'}
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
