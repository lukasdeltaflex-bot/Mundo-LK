'use client';

import React, { useState } from 'react';
import { Share2, Copy, Send, Check, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';
import { AffiliateOffer } from '@/core/domain/entities/affiliate-offer.entity';
import { SocialChannel, CopyStyle } from '@/core/domain/entities/affiliate-content-history.entity';
import { AffiliateDistributionService } from '@/core/application/services/AffiliateDistributionService';
import { Button } from '@/presentation/components/ui/Button';

interface AffiliateShareModalProps {
  offer: AffiliateOffer;
  onClose: () => void;
}

export const AffiliateShareModal: React.FC<AffiliateShareModalProps> = ({ offer, onClose }) => {
  const [selectedChannel, setSelectedChannel] = useState<SocialChannel>('whatsapp');
  const [selectedStyle, setSelectedStyle] = useState<CopyStyle>('aggressive');
  const [copied, setCopied] = useState(false);

  const distributionService = AffiliateDistributionService.getInstance();

  // Seleciona a copy correspondente com base no canal e estilo
  let previewCopy = offer.offerContent.whatsappCopy || '';
  if (selectedChannel === 'instagram') previewCopy = offer.offerContent.instagramCaption || previewCopy;
  if (selectedChannel === 'tiktok') previewCopy = offer.offerContent.tiktokScript || previewCopy;

  const handleCopy = () => {
    navigator.clipboard.writeText(previewCopy);
    distributionService.recordCopyAction({
      offer,
      channel: selectedChannel,
      copyText: previewCopy,
      style: selectedStyle,
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareIntent = () => {
    try {
      let result;
      if (selectedChannel === 'telegram') {
        result = distributionService.createTelegramIntent({ offer, copyText: previewCopy, style: selectedStyle });
      } else {
        result = distributionService.createWhatsAppIntent({ offer, copyText: previewCopy, style: selectedStyle });
      }
      window.open(result.intentUrl, '_blank');
    } catch (err: any) {
      alert(`Erro no disparo: ${err?.message || String(err)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Central de Distribuição & Disparo Social</h3>
              <p className="text-[10px] text-slate-400">Links protegidos & Web Intents oficiais</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs font-bold">✕</button>
        </div>

        {/* Offer Summary Badge */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center gap-3">
          <img src={offer.productData.images.main} alt={offer.productData.title} className="h-12 w-12 rounded-lg object-cover border border-slate-800 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">{offer.productData.title}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-extrabold text-emerald-400">R$ {offer.pricing.currentPrice.toFixed(2)}</span>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300 uppercase">
                {offer.marketplace}
              </span>
            </div>
          </div>
        </div>

        {/* Channel Selector */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">1. Selecione o Canal Social</label>
          <div className="grid grid-cols-4 gap-2">
            {(['whatsapp', 'telegram', 'instagram', 'tiktok'] as SocialChannel[]).map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`rounded-xl p-2 text-center text-xs font-bold transition border ${
                  selectedChannel === ch
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {ch.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Copy Preview Box */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-300">2. Prévia Obrigatória da Copy IA</label>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <ShieldCheck className="h-3 w-3" /> Link Protegido
            </span>
          </div>
          <textarea
            readOnly
            value={previewCopy}
            rows={5}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 font-mono resize-none focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
            className="w-1/2 text-xs border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            {copied ? 'Copiado!' : 'Copiar Texto'}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleShareIntent}
            leftIcon={<Send className="h-3.5 w-3.5" />}
            className="w-1/2 text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
          >
            Disparar {selectedChannel.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
};
