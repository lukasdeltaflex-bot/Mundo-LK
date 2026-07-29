'use client';

import React from 'react';
import {
  History, Share2, ExternalLink, Calendar, ShoppingBag, Eye,
  MousePointerClick, Edit3, Copy, Trash2, Archive, CheckCircle2, Sparkles, Layers,
  Download, FileSpreadsheet, ArrowDown
} from 'lucide-react';
import { Product } from '@/core/domain/entities/product.entity';
import { Button } from '@/presentation/components/ui/Button';
import { OfferShareService } from '@/core/application/services/content/OfferShareService';

export interface OfferAnalytics {
  offerId: string;
  clicks: number;
  shares: number;
  estimatedCommission: string;
  lastInteraction: string;
}

interface OfferHistoryTableProps {
  products: Product[];
  onShareProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDuplicateProduct?: (product: Product) => void;
  onArchiveProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
}

export const OfferHistoryTable: React.FC<OfferHistoryTableProps> = ({
  products,
  onShareProduct,
  onEditProduct,
  onDuplicateProduct,
  onArchiveProduct,
  onDeleteProduct,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  onExportCSV,
  onExportJSON,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl space-y-3">
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="font-bold text-sm text-white flex items-center gap-2">
          <History className="h-4 w-4 text-blue-400" />
          Histórico Operacional & Ciclo de Vida ({products.length} ofertas)
        </span>

        <div className="flex items-center gap-2">
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
          )}

          {onExportJSON && (
            <button
              type="button"
              onClick={onExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-[11px] font-bold text-blue-300 hover:bg-blue-500/20 transition"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar JSON
            </button>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs">
          Nenhuma oferta registrada recentemente no histórico operacional.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Produto</th>
                <th className="p-3">Marketplace</th>
                <th className="p-3">Preço</th>
                <th className="p-3">Status Ciclo</th>
                <th className="p-3">Data</th>
                <th className="p-3 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.map((p) => {
                const isArchived = p.status === 'ARCHIVED' || p.status === 'TRASHED';
                const statusBadge = isArchived
                  ? { label: 'ARQUIVADO', bg: 'bg-slate-800 text-slate-400 border-slate-700' }
                  : { label: 'PUBLICADO', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold text-white truncate max-w-[220px]">
                      {p.title || 'Produto'}
                    </td>

                    <td className="p-3 text-slate-400 capitalize">
                      {p.marketplaceSlug || 'Shopee'}
                    </td>

                    <td className="p-3 text-emerald-400 font-bold">
                      {p.currentPrice ? p.currentPrice.formatBRL() : '—'}
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge.bg}`}>
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {statusBadge.label}
                      </span>
                    </td>

                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onShareProduct && (
                          <button
                            type="button"
                            onClick={() => onShareProduct(p)}
                            title="Compartilhar Novamente"
                            className="p-1.5 rounded-lg border border-slate-800 text-blue-400 hover:bg-blue-500/10 transition"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => OfferShareService.getInstance().copyLink(p.affiliateUrl ? String(p.affiliateUrl) : (p.originalUrl || ''))}
                          title="Copiar Link de Afiliado"
                          className="p-1.5 rounded-lg border border-slate-800 text-emerald-400 hover:bg-emerald-500/10 transition"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>

                        {onEditProduct && (
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            title="Editar Atributos"
                            className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {onDuplicateProduct && (
                          <button
                            type="button"
                            onClick={() => onDuplicateProduct(p)}
                            title="Duplicar Oferta"
                            className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {onArchiveProduct && (
                          <button
                            type="button"
                            onClick={() => onArchiveProduct(p)}
                            title="Arquivar Oferta"
                            className="p-1.5 rounded-lg border border-slate-800 text-amber-400 hover:bg-amber-500/10 transition"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {onDeleteProduct && (
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p)}
                            title="Excluir Oferta"
                            className="p-1.5 rounded-lg border border-slate-800 text-red-400 hover:bg-red-500/10 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && onLoadMore && (
        <div className="p-3 border-t border-slate-800 flex justify-center bg-slate-950/40">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-xs font-bold text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 transition"
          >
            <ArrowDown className="h-4 w-4" />
            {isLoadingMore ? 'Carregando mais ofertas...' : 'Carregar mais ofertas'}
          </button>
        </div>
      )}
    </div>
  );
};
