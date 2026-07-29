'use client';

import React, { useState } from 'react';
import {
  Share2, MessageCircle, Send,
  Copy, Check, ExternalLink, X, Sparkles, CheckCircle2, ShoppingBag,
  QrCode, Calendar, Download, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '@/presentation/context/AuthContext';
import { MarketplaceConnectionService } from '@/core/application/services/integrations/MarketplaceConnectionService';

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

const PinterestIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
  </svg>
);

const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" {...props}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.6a1.6 1.6 0 1 0 1.6 1.6 1.6 1.6 0 0 0-1.6-1.6z"/>
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
  const { user } = useAuth();
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [activeChannels, setActiveChannels] = useState<Array<{ slug: string; name: string; isConnected: boolean }>>([]);

  React.useEffect(() => {
    async function loadChannels() {
      if (!user) return;
      try {
        const list = await MarketplaceConnectionService.getInstance().getActiveConnections(user.uid);
        setActiveChannels(list);
      } catch (err) {
        console.warn('[SocialShareModal] loadChannels error:', err);
      }
    }
    loadChannels();
  }, [user]);

  const prepareShareText = (text?: string): string => {
    const raw = text || `🔥 Oferta imperdível encontrada!\n\nProduto: ${data.title}\nPreço: ${data.price}${data.previousPrice ? ` (De: ${data.previousPrice})` : ''}\n\nConfira agora: ${data.affiliateUrl}`;
    
    // 1. Limpeza estrita de caracteres de substituição corrompidos (\uFFFD)
    let cleaned = raw.replace(/\uFFFD/g, '').trim();

    // 2. Garante a substituição de URLs longas expandidas pelo link curto oficial de afiliado
    if (data.affiliateUrl) {
      cleaned = cleaned.replace(/https:\/\/(www\.)?shopee\.com\.br\/[^\s\n]+/g, data.affiliateUrl);
      cleaned = cleaned.replace(/https:\/\/(www\.)?mercadolivre\.com\.br\/[^\s\n]+/g, data.affiliateUrl);
    }

    return cleaned;
  };

  const whatsAppCopy = prepareShareText(data.whatsAppText);
  const telegramCopy = prepareShareText(data.telegramText);
  const instagramCopy = prepareShareText(data.instagramText);

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data.affiliateUrl)}`;

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
      handleCopy(whatsAppCopy, 'geral');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Painel de Compartilhamento & Mídia
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">
                  Pronta para Divulgar
                </span>
              </h3>
              <p className="text-xs text-slate-400">Publicação em 1-clique, cópia rápida, QR Code e agendamento.</p>
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
          {/* Indicador de Canais Conectados */}
          {activeChannels.length > 0 && (
            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Conectores & Canais Disponíveis
              </span>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {activeChannels.map((c) => (
                  <span
                    key={c.slug}
                    className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border text-[11px] ${
                      c.isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    <span>{c.isConnected ? '✅' : '⚪'}</span>
                    <span>{c.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

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

          {/* Quick Actions Toolbar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-blue-500/30 bg-blue-600/10 text-xs font-bold text-blue-300 hover:bg-blue-600/20 transition"
            >
              <Share2 className="h-4 w-4" />
              <span>Nativo Mobile</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrCode((prev) => !prev)}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-purple-500/30 bg-purple-600/10 text-xs font-bold text-purple-300 hover:bg-purple-600/20 transition"
            >
              <QrCode className="h-4 w-4" />
              <span>{showQrCode ? 'Ocultar QR Code' : 'Gerar QR Code'}</span>
            </button>

            {data.imageUrl && (
              <a
                href={data.imageUrl}
                target="_blank"
                download="produto_oferta.jpg"
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                <Download className="h-4 w-4" />
                <span>Baixar Imagem</span>
              </a>
            )}

            <a
              href="/agendamento"
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-600/10 text-xs font-bold text-emerald-300 hover:bg-emerald-600/20 transition"
            >
              <Calendar className="h-4 w-4" />
              <span>Agendar Post</span>
            </a>
          </div>

          {/* QR Code Panel */}
          {showQrCode && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-center space-y-2 animate-in fade-in duration-200">
              <img src={qrCodeUrl} alt="QR Code da Oferta" className="h-40 w-40 rounded-lg border bg-white p-2" />
              <p className="text-[11px] text-purple-200 font-semibold">QR Code pronto para materiais impressos, panfletos ou banners visualizáveis.</p>
            </div>
          )}

          {/* Channels Grid */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Compartilhar nos Canais Conectados:
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
                    <span className="text-xs font-bold text-white block">WhatsApp Business</span>
                    <span className="text-[10px] text-emerald-300/80">Enviar para Grupos / Lista</span>
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
                    <span className="text-xs font-bold text-white block">Telegram Channel</span>
                    <span className="text-[10px] text-sky-300/80">Publicar no Canal Oficial</span>
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
                    <span className="text-xs font-bold text-white block">Facebook Feed / Grupos</span>
                    <span className="text-[10px] text-blue-300/80">Publicar na Página</span>
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
                    <span className="text-xs font-bold text-white block">Instagram Stories</span>
                    <span className="text-[10px] text-pink-300/80">Copiar legenda e link</span>
                  </div>
                </div>
                <Copy className="h-4 w-4 text-pink-400 opacity-70 group-hover:opacity-100" />
              </button>

              {/* Pinterest */}
              <a
                href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(data.affiliateUrl)}&media=${encodeURIComponent(data.imageUrl || '')}&description=${encodeURIComponent(data.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <PinterestIcon className="h-5 w-5 text-rose-400" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Pinterest Pin</span>
                    <span className="text-[10px] text-rose-300/80">Criar Pin de Produto</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-rose-400 opacity-70 group-hover:opacity-100" />
              </a>

              {/* LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.affiliateUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl border border-blue-600/30 bg-blue-600/10 text-blue-300 hover:bg-blue-600/20 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <LinkedInIcon className="h-5 w-5 text-blue-400" />
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">LinkedIn</span>
                    <span className="text-[10px] text-blue-300/80">Publicar no perfil profissional</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-blue-400 opacity-70 group-hover:opacity-100" />
              </a>

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
                    <span className="text-[10px] text-slate-400">Postar Tweet promocional</span>
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
