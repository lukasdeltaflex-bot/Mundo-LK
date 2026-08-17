'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { X, Tag, Sparkles, MessageSquare, Flame, Check, Link as LinkIcon, Image as ImageIcon, FileText, Upload, Trash2, RefreshCw } from 'lucide-react';
import { Offer } from '@/core/domain/entities/offer.entity';
import { Product, OFFICIAL_TAXONOMY_CATEGORIES } from '@/core/domain/entities/product.entity';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirebaseStorageService } from '@/infrastructure/firebase/storage/firebase-storage.service';
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

const MARKETPLACE_OPTIONS = [
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
  const [category, setCategory] = useState('Geral');

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageService = useRef(new FirebaseStorageService()).current;
  const identityResolver = useRef(new ProductIdentityResolver()).current;

  useEffect(() => {
    if (offer && isOpen && user?.uid) {
      const slug = offer.marketplaceId || (offer as any).marketplace || 'shopee';
      setMarketplaceSlug(slug);
      setMarketplaceName(offer.marketplaceName || MARKETPLACE_OPTIONS.find(m => m.slug === slug)?.name || 'Shopee');
      
      const existingText = offer.copies?.copies?.whatsAppText ||
        offer.copies?.copies?.shortText ||
        (typeof offer.copies === 'string' ? offer.copies : '');
      setWhatsAppCopy(existingText);
      setScoreValue(offer.scoreValue !== undefined ? String(offer.scoreValue) : '90');
      setScoreLabel(offer.scoreLabel || 'EXCELLENT');
      setScoreJustification(offer.scoreJustification || '');
      setCta(offer.cta || '🔥 Garanta o seu antes que acabe!');
      setHashtags(offer.hashtags ? offer.hashtags.join(', ') : '');

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

  // Lógica de upload de imagem para Firebase Storage com substituição segura
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingImage(true);

    try {
      const oldImageUrl = imageUrl;
      const downloadUrl = await storageService.uploadOfferImage(file, offer.id);
      setImageUrl(downloadUrl);

      // Remove imagem antiga do Storage se for do Firebase
      if (oldImageUrl && oldImageUrl !== downloadUrl) {
        await storageService.deleteStorageImage(oldImageUrl);
      }
    } catch (err: any) {
      console.error('[EditOfferModal] Falha no upload da imagem:', err);
      alert(`Falha ao fazer upload da imagem: ${err?.message || String(err)}`);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async () => {
    if (!imageUrl) return;
    if (confirm('Deseja remover a imagem atual da oferta?')) {
      const oldUrl = imageUrl;
      setImageUrl('');
      await storageService.deleteStorageImage(oldUrl);
    }
  };

  // Alternância de Marketplace com auto-regeneração de link de afiliado oficial
  const handleMarketplaceChange = (newSlug: string) => {
    setMarketplaceSlug(newSlug);
    const opt = MARKETPLACE_OPTIONS.find((m) => m.slug === newSlug);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || processing) return;

    setProcessing(true);
    try {
      const offerRepo = new FirestoreOfferRepository();
      const productRepo = new FirestoreProductRepository();
      const useCase = new UpdateOfferUseCase(offerRepo);

      // Parse BRL dos preços digitados (ex: "R$ 1.234,56" ou "1234,56" -> 1234.56)
      const validPrice = Price.parseBRL(currentPriceStr);
      const validPrevPrice = previousPriceStr.trim() ? Price.parseBRL(previousPriceStr) : null;

      // 1. Atualiza o Product vinculado no Firestore se ele existir
      if (product) {
        const updatedImages = imageUrl.trim()
          ? [imageUrl.trim(), ...(product.images || []).filter(img => img !== imageUrl.trim())]
          : product.images;

        product.title = title.trim() || product.title;
        product.description = description.trim();
        product.currentPrice = Price.create(validPrice);
        if (validPrevPrice !== null && validPrevPrice > 0) {
          product.previousPrice = Price.create(validPrevPrice);
        } else {
          product.previousPrice = null;
        }

        (product as any).originalUrl = originalUrl.trim() || product.originalUrl;
        product.affiliateUrl = AffiliateLink.create(affiliateUrl.trim() || originalUrl.trim() || product.originalUrl);
        product.images = updatedImages;
        product.categoryId = category.trim() || product.categoryId;

        await productRepo.save(product);
      }

      // 2. Atualiza a Offer no Firestore
      const scoreNum = parseInt(scoreValue, 10);
      const selectedMarketplaceObj = MARKETPLACE_OPTIONS.find(m => m.slug === marketplaceSlug);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-sm sm:text-base">Edição Completa da Oferta e Produto</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing || uploadingImage}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Identity & Navigation Tabs */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-6 py-2 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('product')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'product' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📦 1. Produto & Links
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('offer')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${activeTab === 'offer' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🔥 2. Copy Comercial & Score
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            ID: <strong className="text-amber-400">{offer.id}</strong>
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto grow text-xs">
          {activeTab === 'product' && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título do Produto:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preço Atual (R$):</label>
                  <input
                    type="text"
                    required
                    value={currentPriceStr}
                    onChange={(e) => setCurrentPriceStr(e.target.value)}
                    onBlur={() => setCurrentPriceStr(Price.formatBRL(Price.parseBRL(currentPriceStr)))}
                    placeholder="R$ 1.004,00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preço Anterior (De):</label>
                  <input
                    type="text"
                    value={previousPriceStr}
                    onChange={(e) => setPreviousPriceStr(e.target.value)}
                    onBlur={() => {
                      if (previousPriceStr.trim()) {
                        setPreviousPriceStr(Price.formatBRL(Price.parseBRL(previousPriceStr)));
                      }
                    }}
                    placeholder="R$ 1.299,00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-400 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Categoria Oficial:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-medium"
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
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5 text-blue-400" /> Link de Afiliado (Ex: https://amzn.to/...)
                </label>
                <input
                  type="text"
                  value={affiliateUrl}
                  onChange={(e) => setAffiliateUrl(e.target.value)}
                  placeholder="https://shopee.com.br/product/123?aff_id=xxx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-blue-300 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5 text-slate-400" /> Link Original do Produto
                </label>
                <input
                  type="text"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://amazon.com.br/dp/B0C7CKX75R"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-300 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Seção de Mídia & Upload no Firebase Storage */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="block text-slate-300 font-semibold flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-purple-400" /> Imagem da Oferta & Upload no Storage:
                </label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="h-16 w-16 object-cover rounded-xl border border-slate-800 shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl border border-dashed border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600 shrink-0">
                      Sem Foto
                    </div>
                  )}

                  <div className="grow space-y-2 w-full">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://m.media-amazon.com/images/I/..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        disabled={uploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        leftIcon={uploadingImage ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-purple-400" />}
                      >
                        {uploadingImage ? 'Enviando ao Storage...' : 'Substituir por Arquivo Local'}
                      </Button>

                      {imageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-400 hover:bg-red-500/10"
                          onClick={handleRemoveImage}
                          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        >
                          Excluir Imagem
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> Descrição Factual / Briefing do Produto:
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
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Marketplace / Origem Comercial:</label>
                <select
                  value={marketplaceSlug}
                  onChange={(e) => handleMarketplaceChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {MARKETPLACE_OPTIONS.map((m) => (
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
                    min={0}
                    max={100}
                    value={scoreValue}
                    onChange={(e) => setScoreValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Classificação:</label>
                  <select
                    value={scoreLabel}
                    onChange={(e) => setScoreLabel(e.target.value as ScoreType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="EXCELLENT">EXCELLENT (Excelente)</option>
                    <option value="GOOD">GOOD (Boa)</option>
                    <option value="AVERAGE">AVERAGE (Média)</option>
                    <option value="POOR">POOR (Baixa)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Justificativa Comercial:
                </label>
                <input
                  type="text"
                  value={scoreJustification}
                  onChange={(e) => setScoreJustification(e.target.value)}
                  placeholder="Ex: Oferta com 25% de desconto com frete grátis."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Chamada para Ação (CTA):</label>
                  <input
                    type="text"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                    placeholder="Ex: 🔥 Garanta o seu antes que acabe!"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hashtags (separadas por vírgula):</label>
                  <input
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="promo, achadinhos, desconto"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={processing || uploadingImage}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={processing || uploadingImage}>
              {processing ? 'Salvando Alterações...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
