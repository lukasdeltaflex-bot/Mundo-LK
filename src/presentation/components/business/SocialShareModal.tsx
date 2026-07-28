'use client';

import React, { useState } from 'react';
import {
  Share2, MessageCircle, Send,
  Copy, Check, ExternalLink, X, Sparkles, CheckCircle2, ShoppingBag
} from 'lucide-react';
import { Button } from '../ui/Button';

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterXIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export interface SocialShareData {
  title: string;
  price: string;
  previousPrice?: string;
  discountPercent?: string;
  imageUrl?: string;
  affiliateUrl: string;
  whatsAppText?: string;
  telegramText?: string;
  instagramText?: string;
  facebookText?: string;
}

export interface SocialShareModalProps {
  data: SocialShareData;
  onClose?: () => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ data, onClose }) => {
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  // Formatted fallback offer copy
  const formattedDefaultText = `🔥 Oferta imperdível encontrada!\n\nProduto: ${data.title}\nPreço: ${data.price}${data.previousPrice ? ` (De: ${data.previousPrice})` : ''}\n\nConfira agora: ${data.affiliateUrl}`;

  const whatsAppCopy = data.whatsAppText || formattedDefaultText;
  const telegramCopy = data.telegramText || formattedDefaultText;
  const instagramCopy = data.instagramText || formattedDefaultText;

  const handleCopy = (text: string, channelName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(channelName);
    setTimeout(() => setCopiedChannel(null), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: `🔥 ${data.title} por ${data.price}!`,
          url: data.affiliateUrl,
        });
      } catch (err) {
        console.log('Compartilhamento nativo cancelado ou não suportado:', err);
      }
    } else {
      handleCopy(formattedDefaultText, 'geral');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Compartilhar Oferta
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">
                  Pronta para Divulgar
                </span>
              </h3>
              <p className="text-xs text-slate-400">Escolha onde deseja publicar ou copie a mensagem pronta.</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Card Summary Preview */}
          <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3.5 items-center">
            {data.imageUrl ? (
              <img src={data.imageUrl} alt={data.title} className="h-16 w-16 rounded-lg object-contain bg-slate-900 p-1 shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-slate-900 flex items-center justify-center text-slate-500 shrink-0">
                <ShoppingBag className="h-8 w-8" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{data.title}</h4>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm font-extrabold text-emerald-400">{data.price}</span>
                {data.previousPrice && (
                  <span className="text-[11px] text-slate-500 line-through">{data.previousPrice}</span>
                )}
                {data.discountPercent && (
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    {data.discountPercent}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{data.affiliateUrl}</p>
            </div>
          </div>

          {/* Quick Copy / Native Share Action */}
          {typeof window !== 'undefined' && 'share' in navigator && (
            <Button
              type="button"
              variant="primary"
              onClick={handleNativeShare}
              className="w-full py-3 text-xs font-extrabold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span>Compartilhamento Nativo no Celular / Apps</span>
            </Button>
          )}

          {/* Channels Grid */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Redes Sociais & Mensageiros:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsAppCopy)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="h-5 w-5 text-emerald-400" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">WhatsApp</span>
                    <span className="text-[10px] text-emerald-300/80">Abrir no app com texto</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-emerald-400 opacity-70 group-hover:opacity-100" />
              </a>

              {/* Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(data.affiliateUrl)}&text=${encodeURIComponent(telegramCopy)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Send className="h-5 w-5 text-sky-400" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Telegram</span>
                    <span className="text-[10px] text-sky-300/80">Compartilhar no Canal</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-sky-400 opacity-70 group-hover:opacity-100" />
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.affiliateUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <FacebookIcon className="h-5 w-5 text-blue-400" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Facebook</span>
                    <span className="text-[10px] text-blue-300/80">Publicar no Feed/Grupo</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-blue-400 opacity-70 group-hover:opacity-100" />
              </a>

              {/* Instagram */}
              <button
                type="button"
                onClick={() => handleCopy(instagramCopy, 'instagram')}
                className="flex items-center justify-between p-3 rounded-xl border border-pink-500/30 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <InstagramIcon className="h-5 w-5 text-pink-400" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Instagram</span>
                    <span className="text-[10px] text-pink-300/80">Copiar legenda p/ Stories</span>
                  </div>
                </div>
                <Copy className="h-4 w-4 text-pink-400 opacity-70 group-hover:opacity-100" />
              </button>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(whatsAppCopy)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <TwitterXIcon className="h-5 w-5 text-slate-300" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">X / Twitter</span>
                    <span className="text-[10px] text-slate-400">Postar Tweet curto</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400 opacity-70 group-hover:opacity-100" />
              </a>
            </div>
          </div>

          {/* Text Area & Copy Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Texto Formatado com Link:</span>
              <button
                type="button"
                onClick={() => handleCopy(whatsAppCopy, 'whatsapp')}
                className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                {copiedChannel === 'whatsapp' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedChannel === 'whatsapp' ? 'Copiado!' : 'Copiar Texto Completo'}</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={4}
              value={whatsAppCopy}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/50 flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} className="text-xs">
            Concluir
          </Button>
        </div>
      </div>
    </div>
  );
};
