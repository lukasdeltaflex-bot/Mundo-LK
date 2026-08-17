'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import {
  FileText,
  Sparkles,
  Upload,
  Trash2,
  Star,
  CheckCircle,
  Link as LinkIcon,
  Tag,
  ArrowRight,
  RefreshCw,
  Video,
  Image as ImageIcon,
  AlertCircle,
  PlusCircle,
  X
} from 'lucide-react';
import { Price, AffiliateLink } from '@/core/domain/value-objects';
import { ProductMedia, OFFICIAL_TAXONOMY_CATEGORIES } from '@/core/domain/entities/product.entity';
import { ReadyOfferParserService, ParsedReadyOffer } from '@/core/domain/services/ReadyOfferParserService';
import { FirebaseStorageService } from '@/infrastructure/firebase/storage/firebase-storage.service';
import { CustomTaxonomyService, CustomMarketplace, CustomCategory } from '@/core/domain/services/CustomTaxonomyService';
import { PublishingService } from '@/app/(dashboard)/operacao/services/PublishingService';
import { ChannelContent } from '@/core/domain/value-objects/channel-content.vo';
import { useAuth } from '@/presentation/context/AuthContext';

interface SaveReadyOfferFlowProps {
  onSaved?: () => void;
}

const DEFAULT_MARKETPLACE_OPTIONS = [
  { slug: 'shopee', name: 'Shopee' },
  { slug: 'magalu', name: 'Magazine Luiza (Magalu)' },
  { slug: 'mercadolivre', name: 'Mercado Livre' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'shein', name: 'SHEIN' },
  { slug: 'geral', name: 'Geral / Outro' },
];

export function SaveReadyOfferFlow({ onSaved }: SaveReadyOfferFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Única Autoridade para o ID da Oferta
  const [officialOfferId] = useState<string>(
    () => `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );

  // Passo 1: Texto colado pelo usuário
  const [pastedText, setPastedText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedReadyOffer | null>(null);

  // Passo 2: Mídias enviadas (Imagens e Vídeos - Arquivo Local ou URL)
  const [mediaList, setMediaList] = useState<ProductMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Inputs para URL de Imagem e URL de Vídeo
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showVideoUrlInput, setShowVideoUrlInput] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // Passo 3: Dados confirmados da Oferta
  const [title, setTitle] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [marketplaceSlug, setMarketplaceSlug] = useState('shopee');
  const [category, setCategory] = useState('Geral');
  const [whatsAppCopy, setWhatsAppCopy] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Taxonomy & Modais de Criação Inline (Marketplace e Categoria)
  const [marketplaceOptions, setMarketplaceOptions] = useState(DEFAULT_MARKETPLACE_OPTIONS);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(OFFICIAL_TAXONOMY_CATEGORIES);
  const [showNewMarketplaceModal, setShowNewMarketplaceModal] = useState(false);
  const [newMarketplaceName, setNewMarketplaceName] = useState('');
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');
  const [creatingTaxonomy, setCreatingTaxonomy] = useState(false);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const parserService = useRef(new ReadyOfferParserService()).current;
  const storageService = useRef(new FirebaseStorageService()).current;
  const taxonomyService = useRef(new CustomTaxonomyService()).current;
  const publishingService = useRef(new PublishingService()).current;

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

  // 1. Analisa a Oferta Pronta com Parser Determinístico (0 IA)
  const handleParseText = () => {
    if (!pastedText.trim()) {
      alert('Por favor, cole o texto da oferta pronta.');
      return;
    }

    const parsed = parserService.parse(pastedText);
    setParsedData(parsed);

    setTitle(parsed.title);
    setPriceStr(Price.formatBRL(parsed.price));
    setOriginalUrl(parsed.url);
    setAffiliateUrl(parsed.url);
    setMarketplaceSlug(parsed.marketplaceSlug);
    setCategory(parsed.suggestedCategory);
    setWhatsAppCopy(parsed.whatsAppText); // 100% Preservada!

    setStep(2);
  };

  // 2. Upload de Arquivos Locais (Imagens e Vídeos) para Firebase Storage com Timeout e Safety Handlers
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, acceptedType: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadStatusMsg(acceptedType === 'video' ? 'Enviando vídeo ao Storage...' : 'Enviando imagem ao Storage...');

    try {
      const newMediaItems: ProductMedia[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const nextOrder = mediaList.length + newMediaItems.length;
        const isFirstItem = nextOrder === 0;

        const mediaItem = await storageService.uploadOfferMediaFile(
          file,
          officialOfferId,
          nextOrder,
          isFirstItem
        );
        newMediaItems.push(mediaItem);
      }

      setMediaList((prev) => {
        const updated = [...prev, ...newMediaItems];
        if (!updated.some((m) => m.isPrimary) && updated.length > 0) {
          updated[0].isPrimary = true;
        }
        return updated;
      });
      setUploadStatusMsg(null);
    } catch (err: any) {
      console.error('[SaveReadyOfferFlow] Erro no upload local:', err);
      setUploadError(err?.message || 'Falha ao realizar upload da mídia.');
    } finally {
      setUploading(false);
      setUploadStatusMsg(null);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  // Adicionar Mídia por URL (Imagem ou Vídeo)
  const handleAddUrlMedia = (mediaType: 'image' | 'video') => {
    const rawUrl = mediaType === 'video' ? videoUrlInput : imageUrlInput;
    if (!rawUrl.trim()) {
      alert('Por favor, informe uma URL válida.');
      return;
    }

    try {
      const nextOrder = mediaList.length;
      const isFirstItem = nextOrder === 0;
      const mediaItem = storageService.buildUrlMedia(rawUrl, mediaType, nextOrder, isFirstItem);

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

  const handleSetPrimaryMedia = (mediaId: string) => {
    setMediaList((prev) =>
      prev.map((m) => ({
        ...m,
        isPrimary: m.id === mediaId,
      }))
    );
  };

  const handleRemoveMedia = async (mediaId: string, url: string) => {
    setMediaList((prev) => {
      const filtered = prev.filter((m) => m.id !== mediaId);
      if (!filtered.some((m) => m.isPrimary) && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });

    await storageService.deleteStorageImage(url);
  };

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

  // 3. Salva a Oferta no Firestore com Mídias e Copy Preservada
  const handleSaveOffer = async () => {
    if (!user?.uid || saving) return;

    setSaving(true);
    try {
      const validPrice = Price.parseBRL(priceStr);
      const primaryMedia = mediaList.find((m) => m.isPrimary) || mediaList[0];
      const primaryImageUrl = primaryMedia ? primaryMedia.url : '';
      const allImageUrls = mediaList.filter((m) => m.type === 'image').map((m) => m.url);

      const selectedOpt = marketplaceOptions.find((m) => m.slug === marketplaceSlug);
      const marketplaceName = selectedOpt ? selectedOpt.name : 'Shopee';

      const extractionResult = {
        title: title.trim() || 'Oferta Pronta',
        description: whatsAppCopy.trim(),
        currentPrice: validPrice,
        originalPrice: null,
        discountPercentage: 0,
        currency: 'BRL',
        brand: 'Geral',
        category,
        subcategory: '',
        marketplace: marketplaceSlug,
        sellerName: marketplaceName,
        sellerRating: 5,
        shippingType: '',
        shippingPrice: null,
        freeShipping: false,
        prime: false,
        full: false,
        mall: false,
        coupon: '',
        cashback: '',
        installments: '',
        image: primaryImageUrl,
        gallery: allImageUrls,
        rating: 5,
        reviewCount: 0,
        soldQuantity: '',
        productId: `prod_${officialOfferId}`,
        canonicalUrl: originalUrl.trim(),
        originalUrl: originalUrl.trim(),
        affiliateUrl: affiliateUrl.trim() || originalUrl.trim(),
      };

      const copies = ChannelContent.create({
        whatsAppText: whatsAppCopy.trim(),
        telegramText: whatsAppCopy.trim(),
        instagramText: whatsAppCopy.trim(),
        facebookText: whatsAppCopy.trim(),
      });

      const offerProps = {
        id: officialOfferId,
        userId: user.uid,
        marketplaceId: marketplaceSlug,
        marketplaceName,
        copies,
        media: mediaList,
        scoreValue: 95,
        scoreLabel: 'EXCELLENT' as const,
        scoreJustification: 'Oferta Pronta Importada pelo Usuário',
        cta: '🔥 Aproveite essa oferta!',
        hashtags: ['oferta', 'promo', 'desconto'],
        emojis: ['🔥', '⚡'],
        aiProviderUsed: 'USER_PRESERVED_COPY',
      };

      await publishingService.saveProductAndOffer(extractionResult, offerProps as any, user.uid);

      setSaveSuccess(true);
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error('[SaveReadyOfferFlow] Erro ao salvar oferta pronta:', err);
      alert(`Erro ao salvar a oferta: ${err?.message || String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (saveSuccess) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-950/20 p-8 text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
        <h3 className="text-xl font-bold text-white">Oferta Pronta Salva com Sucesso!</h3>
        <p className="text-xs text-slate-300">
          Sua oferta foi gravada no catálogo com mídias e Copy 100% preservadas.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSaveSuccess(false);
              setStep(1);
              setPastedText('');
              setMediaList([]);
              setParsedData(null);
            }}
          >
            📋 Criar Outra Oferta Pronta
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900 shadow-xl overflow-hidden text-xs">
      <CardHeader className="border-b border-slate-800 bg-slate-950/50 p-4">
        <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <span>Salvar Oferta Pronta (Importação sem IA)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Passo {step} de 3
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* PASSO 1: Cole a Oferta Pronta */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-3 text-slate-300 text-xs leading-relaxed">
              💡 <strong>Cole o texto completo da oferta recebida.</strong> Nosso analisador identificará automaticamente o título, o preço e o link, e <strong>preservará a Copy idêntica</strong> sem reescrevê-la com IA.
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cole aqui o texto da oferta pronta:</label>
              <textarea
                rows={8}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="💥 BARATINHO!&#10;&#10;😱 Batom Líquido Dailus Matte 12h&#10;💰 Apenas R$ 14,90!&#10;&#10;🛒 Corra para garantir: https://s.shopee.com.br/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleParseText} leftIcon={<ArrowRight className="h-4 w-4" />}>
                Analisar Oferta Pronta
              </Button>
            </div>
          </div>
        )}

        {/* PASSO 2: Mídias da Oferta (Imagens & Vídeos - Arquivo PC ou URL) */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-purple-400" />
                <span>Mídias da Oferta (Imagens e Vídeos MISTOS)</span>
              </h4>
              <span className="text-[11px] text-slate-400">{mediaList.length} mídia(s) anexada(s)</span>
            </div>

            {uploadError && (
              <div className="flex items-center justify-between p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
                <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-200">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Seções de Adicionar Imagem & Vídeo (Dual Entry: Arquivo vs Link) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Box de Imagens */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <ImageIcon className="h-4 w-4" /> Imagens
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleLocalFileUpload(e, 'image')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-center text-xs"
                    disabled={uploading}
                    onClick={() => imageFileInputRef.current?.click()}
                    leftIcon={uploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-purple-400" />}
                  >
                    📁 Anexar Imagem do PC
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs text-slate-400 hover:text-white"
                    onClick={() => setShowImageUrlInput(!showImageUrlInput)}
                    leftIcon={<LinkIcon className="h-3.5 w-3.5 text-blue-400" />}
                  >
                    🔗 Usar link da imagem (URL)
                  </Button>

                  {showImageUrlInput && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://.../imagem.jpg"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
                      />
                      <Button type="button" variant="primary" size="sm" onClick={() => handleAddUrlMedia('image')}>
                        OK
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Box de Vídeos */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <Video className="h-4 w-4" /> Vídeos
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={(e) => handleLocalFileUpload(e, 'video')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-center text-xs"
                    disabled={uploading}
                    onClick={() => videoFileInputRef.current?.click()}
                    leftIcon={uploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 text-blue-400" />}
                  >
                    📁 Anexar Vídeo do PC
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs text-slate-400 hover:text-white"
                    onClick={() => setShowVideoUrlInput(!showVideoUrlInput)}
                    leftIcon={<LinkIcon className="h-3.5 w-3.5 text-blue-400" />}
                  >
                    🔗 Usar link do vídeo (URL)
                  </Button>

                  {showVideoUrlInput && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder="https://.../video.mp4"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
                      />
                      <Button type="button" variant="primary" size="sm" onClick={() => handleAddUrlMedia('video')}>
                        OK
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {uploadStatusMsg && (
              <div className="flex items-center justify-center gap-2 p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-purple-300 font-semibold animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{uploadStatusMsg}</span>
              </div>
            )}

            {/* Grid de Mídias Carregadas (Preview em Tempo Real) */}
            {mediaList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {mediaList.map((m) => (
                  <div key={m.id} className={`relative rounded-xl border p-2 bg-slate-950 flex flex-col gap-2 ${m.isPrimary ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-slate-800'}`}>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                      {m.type === 'video' ? (
                        <video src={m.url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      )}

                      {/* Badge Capa */}
                      {m.isPrimary && (
                        <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-slate-950" /> Capa
                        </span>
                      )}

                      <span className="absolute bottom-1 right-1 bg-slate-950/80 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        {m.type === 'video' ? <Video className="h-3 w-3 text-blue-400" /> : <ImageIcon className="h-3 w-3 text-purple-400" />}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      {!m.isPrimary && m.type === 'image' && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryMedia(m.id)}
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" /> Marcar Capa
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(m.id, m.url)}
                        className="text-red-400 hover:text-red-300 p-1 ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button variant="primary" size="sm" onClick={() => setStep(3)} leftIcon={<ArrowRight className="h-4 w-4" />}>
                Revisar & Salvar Oferta
              </Button>
            </div>
          </div>
        )}

        {/* PASSO 3: Revisão & Salvamento Final */}
        {step === 3 && (
          <div className="space-y-4">
            <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Revisão Final da Oferta Pronta</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título do Produto:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Preço Atual (R$):</label>
                  <input
                    type="text"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    onBlur={() => setPriceStr(Price.formatBRL(Price.parseBRL(priceStr)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-bold font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Marketplace:</label>
                    <button
                      type="button"
                      onClick={() => setShowNewMarketplaceModal(true)}
                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      <PlusCircle className="h-3 w-3" /> Criar Novo
                    </button>
                  </div>
                  <select
                    value={marketplaceSlug}
                    onChange={(e) => setMarketplaceSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                  >
                    {marketplaceOptions.map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Categoria Oficial:</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryModal(true)}
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <PlusCircle className="h-3 w-3" /> Criar Nova
                  </button>
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5 text-blue-400" /> Link do Produto / Afiliado:
                </label>
                <input
                  type="text"
                  value={originalUrl}
                  onChange={(e) => {
                    setOriginalUrl(e.target.value);
                    setAffiliateUrl(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-blue-300 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>Copy Preservada (WhatsApp):</span>
                <span className="text-[10px] text-emerald-400 font-mono">100% Texto Original Preservado</span>
              </label>
              <textarea
                rows={6}
                value={whatsAppCopy}
                onChange={(e) => setWhatsAppCopy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono leading-relaxed focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-between border-t border-slate-800 pt-3">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveOffer} disabled={saving} leftIcon={saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}>
                {saving ? 'Salvando Oferta...' : 'Salvar Oferta Pronta'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* MODAL INLINE DE CRIAÇÃO DE NOVO MARKETPLACE */}
      {showNewMarketplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-blue-400" />
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
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
    </Card>
  );
}
