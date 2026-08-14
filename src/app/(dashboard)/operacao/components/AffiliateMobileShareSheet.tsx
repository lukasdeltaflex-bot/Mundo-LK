'use client';

import React, { useState } from 'react';
import {
  X, Share2, Copy, Send, Sparkles, ExternalLink,
  Star, Flame, Pin, Clock, Eye, Check, RefreshCw
} from 'lucide-react';
import { AffiliateOffer } from '@/core/domain/entities/affiliate-offer.entity';
import { AffiliateDistributionService } from '@/core/application/services/AffiliateDistributionService';
import { AIService } from '../services/AIService';
import { Button } from '@/presentation/components/ui/Button';

export type ExtendedFavoriteStatus = 'FAVORITO' | 'PRIORIDADE_MAXIMA' | 'FIXADO' | 'PUBLICAR_DEPOIS' | 'NENHUM';

interface AffiliateMobileShareSheetProps {
  offer: AffiliateOffer;
  isOpen: boolean;
  onClose: () => void;
}

export const AffiliateMobileShareSheet: React.FC<AffiliateMobileShareSheetProps> = ({
  offer,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const distributionService = AffiliateDistributionService.getInstance();

  const savedText = (offer as any).copies?.whatsAppText || (offer as any).whatsAppText;
  const [copyText, setCopyText] = useState(
    savedText || `🔥 *ACHADO IMPERDÍVEL!*\n\n📦 *${offer.productData.title}*\n\n💰 Por apenas: *R$ ${offer.pricing.currentPrice.toFixed(2)}*\n\n👉 Garanta o seu no link oficial:\n${offer.affiliateLink.affiliateUrl}`
  );
  const [favoriteStatus, setFavoriteStatus] = useState<ExtendedFavoriteStatus>('NENHUM');
  const [focusMode, setFocusMode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCopy, setCopiedCopy] = useState(false);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  const handleShareWhatsApp = () => {
    const res = distributionService.createWhatsAppIntent({ offer, copyText, style: 'aggressive' });
    window.open(res.intentUrl, '_blank');
  };

  const handleShareWhatsAppBusiness = () => {
    const encoded = encodeURIComponent(copyText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleShareTelegram = () => {
    const res = distributionService.createTelegramIntent({ offer, copyText });
    window.open(res.intentUrl, '_blank');
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(offer.affiliateLink.affiliateUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCopy = async () => {
    await navigator.clipboard.writeText(copyText);
    setCopiedCopy(true);
    setTimeout(() => setCopiedCopy(false), 2000);
  };

  const handleRegenerateCopy = async () => {
    setIsGeneratingCopy(true);
    try {
      const newCopy = await AIService.generateOfferCopy({
        title: offer.productData.title,
        description: offer.productData.description,
        brand: offer.productData.brand,
        category: offer.productData.category,
        marketplaceSlug: offer.marketplace,
        price: offer.pricing.currentPrice,
        previousPrice: offer.pricing.originalPrice ?? undefined,
        affiliateUrl: offer.affiliateLink.affiliateUrl,
        style: 'whatsapp',
      });
      setCopyText(newCopy);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet Content */}
      <div className="relative w-full max-h-[90vh] bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 space-y-4 z-10 overflow-y-auto shadow-2xl safe-area-pb">
        {/* Header Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs font-extrabold text-blue-400 uppercase">
              {offer.marketplace}
            </span>
            <span className="text-xs font-bold text-white truncate max-w-[180px]">
              {offer.productData.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`p-2 rounded-xl border text-xs ${
                focusMode ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
              title="Modo Foco"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── LIVE PREVIEW CARD DE MENSAGEM ─────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-900 pb-1.5">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-400" /> Pré-visualização da Mensagem Real
            </span>
            <button
              onClick={handleRegenerateCopy}
              disabled={isGeneratingCopy}
              className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className={`h-3 w-3 ${isGeneratingCopy ? 'animate-spin' : ''}`} />
              Nova Copy
            </button>
          </div>

          <div className="flex gap-3 items-start">
            <img
              src={offer.productData.images.main}
              alt={offer.productData.title}
              className="h-16 w-16 rounded-xl object-cover border border-slate-800 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-white block line-clamp-1">{offer.productData.title}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-extrabold text-emerald-400">
                  R$ {offer.pricing.currentPrice.toFixed(2)}
                </span>
                {offer.pricing.originalPrice && (
                  <span className="text-xs text-slate-500 line-through">
                    R$ {offer.pricing.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Copy Editable Field */}
          <textarea
            value={copyText}
            onChange={(e) => setCopyText(e.target.value)}
            rows={4}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono leading-relaxed"
          />
        </div>

        {/* ─── BOTÕES FAVORITOS ESTENDIDOS ─────────────────────────────────── */}
        {!focusMode && (
          <div className="flex items-center justify-around bg-slate-950 p-2 rounded-2xl border border-slate-800">
            <button
              onClick={() => setFavoriteStatus(favoriteStatus === 'FAVORITO' ? 'NENHUM' : 'FAVORITO')}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-xl border ${
                favoriteStatus === 'FAVORITO' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'text-slate-400 border-transparent'
              }`}
            >
              <Star className="h-3.5 w-3.5" /> Favorito
            </button>

            <button
              onClick={() => setFavoriteStatus(favoriteStatus === 'PRIORIDADE_MAXIMA' ? 'NENHUM' : 'PRIORIDADE_MAXIMA')}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-xl border ${
                favoriteStatus === 'PRIORIDADE_MAXIMA' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'text-slate-400 border-transparent'
              }`}
            >
              <Flame className="h-3.5 w-3.5" /> Máxima
            </button>

            <button
              onClick={() => setFavoriteStatus(favoriteStatus === 'FIXADO' ? 'NENHUM' : 'FIXADO')}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-xl border ${
                favoriteStatus === 'FIXADO' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-slate-400 border-transparent'
              }`}
            >
              <Pin className="h-3.5 w-3.5" /> Fixar
            </button>

            <button
              onClick={() => setFavoriteStatus(favoriteStatus === 'PUBLICAR_DEPOIS' ? 'NENHUM' : 'PUBLICAR_DEPOIS')}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-xl border ${
                favoriteStatus === 'PUBLICAR_DEPOIS' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'text-slate-400 border-transparent'
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Depois
            </button>
          </div>
        )}

        {/* ─── SEÇÃO COMPARTILHAR COM 1 TOQUE (TOUCH TARGETS 44–48PX) ───────────────────── */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 block px-1">Disparo Direct Intents com 1 Toque:</span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition"
            >
              <Send className="h-4 w-4" /> WhatsApp
            </button>

            <button
              onClick={handleShareWhatsAppBusiness}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/30 active:scale-95 transition"
            >
              <Send className="h-4 w-4" /> WA Business
            </button>

            <button
              onClick={handleShareTelegram}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 active:scale-95 transition"
            >
              <Send className="h-4 w-4" /> Telegram
            </button>

            <button
              onClick={handleCopyCopy}
              className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition"
            >
              {copiedCopy ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedCopy ? 'Copy Copiada!' : 'Copiar Copy'}
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition"
          >
            {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <ExternalLink className="h-4 w-4 text-blue-400" />}
            {copiedLink ? 'Link Protegido Copiado!' : 'Copiar Link Imutável'}
          </button>
        </div>
      </div>
    </div>
  );
};
