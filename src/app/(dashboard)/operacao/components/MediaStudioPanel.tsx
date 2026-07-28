'use client';

import React from 'react';
import { Palette, Image as ImageIcon, Download, Sparkles, Layers, QrCode } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';

interface MediaStudioPanelProps {
  productImage?: string;
  productTitle?: string;
}

const MEDIA_FORMATS = [
  { id: 'feed', label: 'Feed 1:1', ratio: '1080 x 1080', desc: 'Quadrado para Instagram & Facebook' },
  { id: 'story', label: 'Story 9:16', ratio: '1080 x 1920', desc: 'Vertical para Instagram, WhatsApp & TikTok' },
  { id: 'banner', label: 'Banner Promocional', ratio: '1200 x 628', desc: 'Horizontal para Facebook & Sites' },
  { id: 'pinterest', label: 'Pin 2:3', ratio: '1000 x 1500', desc: 'Vertical otimizado para Pinterest' },
];

export const MediaStudioPanel: React.FC<MediaStudioPanelProps> = ({ productImage, productTitle }) => {
  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-5 shadow-xl space-y-4">
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Palette className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Media Studio — Gerador Visual de Campanhas
          </h3>
          <p className="text-[11px] text-slate-400">
            Formatação visual automática para Feed, Stories, Banners e Pins com selos da oferta.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {MEDIA_FORMATS.map((fmt) => (
          <div
            key={fmt.id}
            className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 hover:border-indigo-500/50 transition space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{fmt.label}</span>
              <span className="text-[10px] font-mono text-indigo-400">{fmt.ratio}</span>
            </div>

            <p className="text-[10px] text-slate-400">{fmt.desc}</p>

            <div className="aspect-square w-full rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
              {productImage ? (
                <img src={productImage} alt={productTitle || 'Preview'} className="h-full w-full object-contain p-2" />
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-700" />
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3 w-3" />}
              className="text-[11px] border-slate-800 text-slate-300 hover:text-white"
            >
              Baixar Formato
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
