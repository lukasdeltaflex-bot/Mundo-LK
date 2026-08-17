'use client';

import React, { useState, useRef } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Price, AffiliateLink } from '@/core/domain/value-objects';
import { ProductMedia, OFFICIAL_TAXONOMY_CATEGORIES } from '@/core/domain/entities/product.entity';
import { ReadyOfferParserService, ParsedReadyOffer } from '@/core/domain/services/ReadyOfferParserService';
import { FirebaseStorageService } from '@/infrastructure/firebase/storage/firebase-storage.service';
import { PublishingService } from '@/app/(dashboard)/operacao/services/PublishingService';
import { ChannelContent } from '@/core/domain/value-objects/channel-content.vo';
import { useAuth } from '@/presentation/context/AuthContext';
import { MarketplaceRegistry } from '@/infrastructure/marketplaces/registry/MarketplaceRegistry';

interface SaveReadyOfferFlowProps {
  onSaved?: () => void;
}

const MARKETPLACE_OPTIONS = [
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

  // Única Autoridade para o ID da Oferta (Gerado uma única vez na inicialização)
  const [officialOfferId] = useState<string>(
    () => `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  );

  // Passo 1: Texto colado pelo usuário
  const [pastedText, setPastedText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedReadyOffer | null>(null);

  // Passo 2: Mídias enviadas (Imagens e Vídeos)
  const [mediaList, setMediaList] = useState<ProductMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const parserService = useRef(new ReadyOfferParserService()).current;
  const storageService = useRef(new FirebaseStorageService()).current;
  const publishingService = useRef(new PublishingService()).current;

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

  // 2. Upload de Arquivos de Mídia (Fotos e Vídeos) para Firebase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

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
        // Garante que pelo menos 1 item seja primário
        if (!updated.some((m) => m.isPrimary) && updated.length > 0) {
          updated[0].isPrimary = true;
        }
        return updated;
      });
    } catch (err: any) {
      console.error('[SaveReadyOfferFlow] Erro de upload:', err);
      setUploadError(err?.message || 'Falha ao fazer upload da mídia.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

    // Remove arquivo no Storage se for do Firebase Storage
    await storageService.deleteStorageImage(url);
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

      const selectedOpt = MARKETPLACE_OPTIONS.find((m) => m.slug === marketplaceSlug);
      const marketplaceName = selectedOpt ? selectedOpt.name : 'Shopee';

      // 1. Extração Simulada para o Dominio (0 chamadas IA)
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

      // 2. Transmite a Copy Preservada do Usuário sem reescrita
      const copies = ChannelContent.create({
        whatsAppText: whatsAppCopy.trim(),
        telegramText: whatsAppCopy.trim(),
        instagramText: whatsAppCopy.trim(),
        facebookText: whatsAppCopy.trim(),
      });

      const offerProps = {
        id: officialOfferId, // ID oficial único
        userId: user.uid,
        marketplaceId: marketplaceSlug,
        marketplaceName,
        copies,
        media: mediaList, // Mídias vinculadas diretamente à Offer
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

        {/* PASSO 2: Mídias da Oferta (Imagens & Vídeos) */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-purple-400" />
                <span>Mídias da Oferta (Imagens e Vídeos)</span>
              </h4>
              <span className="text-[11px] text-slate-400">{mediaList.length} mídia(s) anexada(s)</span>
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Dropzone de Upload */}
            <div className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 bg-slate-950/60 rounded-xl p-6 text-center transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-200 text-xs">Clique ou arraste imagens e vídeos aqui</p>
              <p className="text-[11px] text-slate-500 mt-1">Suporta fotos (PNG, JPG, WEBP até 10MB) e vídeos (MP4, WEBM até 50MB)</p>
              {uploading && (
                <div className="flex items-center justify-center gap-2 mt-3 text-purple-400 font-semibold">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Enviando mídias ao Storage...
                </div>
              )}
            </div>

            {/* Grid de Mídias Carregadas */}
            {mediaList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {mediaList.map((m) => (
                  <div key={m.id} className={`relative rounded-xl border p-2 bg-slate-950 flex flex-col gap-2 ${m.isPrimary ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-slate-800'}`}>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                      {m.type === 'video' ? (
                        <video src={m.url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      )}

                      {/* Badge Primária */}
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
                      {!m.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryMedia(m.id)}
                          className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" /> Definir Capa
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
                  <label className="block text-slate-300 font-semibold mb-1">Marketplace:</label>
                  <select
                    value={marketplaceSlug}
                    onChange={(e) => setMarketplaceSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                  >
                    {MARKETPLACE_OPTIONS.map((m) => (
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
                <label className="block text-slate-300 font-semibold mb-1">Categoria Oficial:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {OFFICIAL_TAXONOMY_CATEGORIES.map((cat) => (
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
    </Card>
  );
}
