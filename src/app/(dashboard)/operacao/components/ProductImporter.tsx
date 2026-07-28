'use client';

import React, { useState } from 'react';
import {
  Search, Link as LinkIcon, Sparkles, Loader2, Barcode, Layers,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Cpu, Server, AlertCircle
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import { ResolutionStepLog } from '../services/ImportEngine';

export type ImportMode = 'url' | 'sku' | 'ean' | 'name' | 'batch';

interface ProductImporterProps {
  onImport: (input: string, mode: ImportMode) => Promise<void>;
  isLoading?: boolean;
  resolutionLogs?: ResolutionStepLog[];
  sourceProvider?: string | null;
}

export const ProductImporter: React.FC<ProductImporterProps> = ({
  onImport,
  isLoading,
  resolutionLogs = [],
  sourceProvider,
}) => {
  const [mode, setMode] = useState<ImportMode>('url');
  const [inputVal, setInputVal] = useState('');
  const [showLogs, setShowLogs] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onImport(inputVal.trim(), mode);
  };

  return (
    <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-5 md:p-6 shadow-2xl space-y-4">
      {/* Header do Motor Universal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-md">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              Motor Universal de Importação & Pipeline de Resolução (6 Níveis)
            </h2>
            <p className="text-xs text-slate-300">
              Resolução em cascata: API Oficial ➔ Cache ➔ ZenRows ➔ Apify ➔ Parser ➔ Conferência Manual
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

      {/* Formulário de Importação */}
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
          {isLoading ? 'Executando Pipeline...' : 'Importar Produto'}
        </Button>
      </form>

      {/* Observabilidade: Painel de Logs do Pipeline */}
      {resolutionLogs.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3.5 space-y-2 text-xs">
          <div
            className="flex items-center justify-between cursor-pointer select-none border-b border-slate-900 pb-2"
            onClick={() => setShowLogs(!showLogs)}
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              <span className="font-bold text-white">Observabilidade do Pipeline de Resolução</span>
              {sourceProvider && (
                <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                  Fonte Final: {sourceProvider}
                </span>
              )}
            </div>
            {showLogs ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </div>

          {showLogs && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1 pr-1 font-mono text-[11px]">
              {resolutionLogs.map((log, idx) => (
                <div key={idx} className="flex items-start justify-between gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 font-bold">Nível {log.stepNumber}:</span>
                    <div>
                      <span className="font-bold text-white mr-1">{log.stepName}</span>
                      <span className="text-slate-400">({log.providerName})</span>
                      <p className="text-[10px] text-slate-300 mt-0.5">{log.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">{log.durationMs}ms</span>
                    {log.status === 'SUCCESS' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                    {log.status === 'FAILED' && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                    {log.status === 'SKIPPED' && <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
