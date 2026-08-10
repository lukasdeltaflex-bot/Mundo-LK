'use client';

import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

export interface PaginationControlsProps {
  currentPage: number;
  pageSize: number;
  onPageSizeChange: (newSize: number) => void;
  hasMore: boolean;
  onNext: () => void;
  onPrev: () => void;
  isFirstPage: boolean;
  loading: boolean;
  totalDisplayed: number;
  pageSizeOptions?: number[];
}

export function PaginationControls({
  currentPage,
  pageSize,
  onPageSizeChange,
  hasMore,
  onNext,
  onPrev,
  isFirstPage,
  loading,
  totalDisplayed,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs text-slate-400">
      {/* Esquerda: Exibição por página */}
      <div className="flex items-center gap-2">
        <span>Exibir</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={loading}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </select>
        <span>• Exibindo {totalDisplayed} registro(s) nesta página</span>
      </div>

      {/* Direita: Botões Anterior / Próxima e Número da Página */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs px-3 py-1.5"
          disabled={isFirstPage || loading}
          onClick={onPrev}
          leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
        >
          Anterior
        </Button>

        <div className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs font-semibold text-slate-300">
          Página {currentPage}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="text-xs px-3 py-1.5"
          disabled={!hasMore || loading}
          onClick={onNext}
          rightIcon={
            loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          }
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
