'use client';

import React, { useState } from 'react';
import { Copy, Check, Share2, Send, MessageCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ChannelCopyBoxProps {
  whatsAppText: string;
  telegramText: string;
  instagramText: string;
  affiliateUrl: string;
}

export const ChannelCopyBox: React.FC<ChannelCopyBoxProps> = ({
  whatsAppText,
  telegramText,
  instagramText,
  affiliateUrl,
}) => {
  const [copiedChannel, setCopiedChannel] = useState<string | null>(null);

  const copyToClipboard = async (text: string, channelName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedChannel(channelName);
      setTimeout(() => setCopiedChannel(null), 2000);
    } catch {
      // Fallback
    }
  };

  const shareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppText)}`;
    window.open(url, '_blank');
  };

  const shareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(affiliateUrl)}&text=${encodeURIComponent(whatsAppText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
          <Share2 className="h-3.5 w-3.5" />
          <span>Central de Cópias em 1-Clique</span>
        </h4>
        {copiedChannel && (
          <span className="text-xs font-semibold text-emerald-400 animate-pulse">
            ✓ Texto para {copiedChannel} copiado!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="justify-start text-xs border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
          leftIcon={copiedChannel === 'WhatsApp' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-emerald-400" />}
          onClick={() => copyToClipboard(whatsAppText, 'WhatsApp')}
        >
          Copiar WhatsApp
        </Button>

        <Button
          size="sm"
          variant="secondary"
          className="justify-start text-xs border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-300"
          leftIcon={copiedChannel === 'Telegram' ? <Check className="h-3.5 w-3.5 text-sky-400" /> : <Copy className="h-3.5 w-3.5 text-sky-400" />}
          onClick={() => copyToClipboard(telegramText, 'Telegram')}
        >
          Copiar Telegram
        </Button>

        <Button
          size="sm"
          variant="secondary"
          className="justify-start text-xs border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300"
          leftIcon={copiedChannel === 'Instagram' ? <Check className="h-3.5 w-3.5 text-purple-400" /> : <Copy className="h-3.5 w-3.5 text-purple-400" />}
          onClick={() => copyToClipboard(instagramText, 'Instagram')}
        >
          Copiar Instagram
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
        <Button
          size="sm"
          variant="primary"
          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
          leftIcon={<MessageCircle className="h-3.5 w-3.5" />}
          onClick={shareWhatsApp}
        >
          Enviar no WhatsApp
        </Button>

        <Button
          size="sm"
          variant="primary"
          className="bg-sky-600 hover:bg-sky-700 text-xs"
          leftIcon={<Send className="h-3.5 w-3.5" />}
          onClick={shareTelegram}
        >
          Enviar no Telegram
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          leftIcon={<Copy className="h-3.5 w-3.5" />}
          onClick={() => copyToClipboard(affiliateUrl, 'Link de Afiliado')}
        >
          Copiar Link
        </Button>
      </div>
    </div>
  );
};
