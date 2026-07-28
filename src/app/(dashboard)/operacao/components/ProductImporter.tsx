'use client';

import React, { useState } from 'react';
import { Search, Link as LinkIcon, Sparkles, Loader2, Barcode, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';

export type ImportMode = 'url' | 'sku' | 'ean' | 'name' | 'batch';

interface ProductImporterProps {
  onImport: (input: string, mode: ImportMode) => Promise<void>;
  isLoading?: boolean;
}

export const ProductImporter: React.FC<ProductImporterProps> = ({ onImport, isLoading }) => {
  const [mode, setMode] = useState<ImportMode>('url');
  const [inputVal, setInputVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onImport(inputVal.trim(), mode);
  };

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-5 md:p-6 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-md">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              Motor Universal de Importação de Produtos
            </h2>
            <p className="text-xs text-slate-300">
              Cole o link do produto, código SKU, EAN/GTIN ou nome do anúncio para resolução automática.
            </p>
          </div>
        </div>

        {/* Selector de modo */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 p-1 border border-slate-800 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'url' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Link URL
          </button>
          <button
            type="button"
            onClick={() => setMode('sku')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'sku' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            SKU / ID
          </button>
          <button
            type="button"
            onClick={() => setMode('ean')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'ean' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            EAN / GTIN
          </button>
          <button
            type="button"
            onClick={() => setMode('name')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'name' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Nome
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {mode === 'url' ? <LinkIcon className="h-4 w-4" /> : mode === 'ean' ? <Barcode className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isLoading}
            placeholder={
              mode === 'url'
                ? 'Cole o link do produto (ex: https://shopee.com.br/product... ou https://mercadolivre.com.br/...)'
                : mode === 'sku'
                ? 'Digite o SKU ou ID do produto no marketplace (ex: MLB38291029)...'
                : mode === 'ean'
                ? 'Digite o código de barras EAN/GTIN (ex: 7898492019201)...'
                : 'Digite o nome ou termo do produto...'
            }
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading || !inputVal.trim()}
          leftIcon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          className="text-xs font-extrabold px-6 py-3 shrink-0 shadow-lg shadow-blue-600/20"
        >
          {isLoading ? 'Resolvendo Pipeline...' : 'Importar Produto'}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
        <span className="flex items-center gap-1 text-slate-300">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Resolution Waterfall Ativo
        </span>
        <span>Shopee Anti-bot Bypass</span>
        <span>Mercado Livre SP-API</span>
        <span>Amazon SP-API</span>
        <span>Magalu / AliExpress</span>
      </div>
    </div>
  );
};
