'use client';

import React from 'react';
import {
  History, Share2, ExternalLink, Calendar, ShoppingBag, Eye,
  MousePointerClick, Edit3, Copy, Trash2, Archive, CheckCircle2, Sparkles, Layers
} from 'lucide-react';
import { Product } from '@/core/domain/entities/product.entity';
import { Button } from '@/presentation/components/ui/Button';

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
}

export const OfferHistoryTable: React.FC<OfferHistoryTableProps> = ({
  products,
  onShareProduct,
  onEditProduct,
  onDuplicateProduct,
  onArchiveProduct,
  onDeleteProduct,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl space-y-3">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <span className="font-bold text-sm text-white flex items-center gap-2">
          <History className="h-4 w-4 text-blue-400" />
          Histórico Operacional & Ciclo de Vida das Ofertas ({products.length})
        </span>
        <span className="text-[11px] text-slate-400 font-mono">Status & Disparos em Tempo Real</span>
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
                            title="Compartlhar Novamente"
                            className="p-1.5 rounded-lg border border-slate-800 text-blue-400 hover:bg-blue-500/10 transition"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                        )}

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
    </div>
  );
};
