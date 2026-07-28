'use client';

import React from 'react';
import { History, Share2, ExternalLink, Calendar, ShoppingBag, Eye, MousePointerClick } from 'lucide-react';
import { Product } from '@/core/domain/entities/product.entity';
import { Button } from '@/presentation/components/ui/Button';

interface OfferHistoryTableProps {
  products: Product[];
  onShareProduct?: (product: Product) => void;
}

export const OfferHistoryTable: React.FC<OfferHistoryTableProps> = ({ products, onShareProduct }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl space-y-3">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <span className="font-bold text-sm text-white flex items-center gap-2">
          <History className="h-4 w-4 text-blue-400" />
          Histórico Operacional de Ofertas Importadas ({products.length})
        </span>
      </div>

      {products.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs">
          Nenhuma oferta registrada recentemente no histórico.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">Produto</th>
                <th className="p-3">Marketplace</th>
                <th className="p-3">Preço</th>
                <th className="p-3">Data</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {products.slice(0, 10).map((p) => (
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
                  <td className="p-3 text-slate-400 font-mono">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : 'Hoje'}
                  </td>
                  <td className="p-3 text-right">
                    {onShareProduct && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onShareProduct(p)}
                        leftIcon={<Share2 className="h-3.5 w-3.5 text-blue-400" />}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Compartilhar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
