'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Plus, X, Calendar, Send, ShoppingBag, Clock } from 'lucide-react';
import { Product } from '@/core/domain/entities/product.entity';
import { MarketplaceBadge } from './MarketplaceBadge';
import { Button } from '@/presentation/components/ui/Button';

interface DuplicateProductModalProps {
  existingProduct: Product;
  matchReason?: string;
  onUpdateExisting: () => void;
  onForceCreateNew: () => void;
  onCancel: () => void;
}

export const DuplicateProductModal: React.FC<DuplicateProductModalProps> = ({
  existingProduct,
  matchReason,
  onUpdateExisting,
  onForceCreateNew,
  onCancel,
}) => {
  const formattedPrice = existingProduct.currentPrice
    ? existingProduct.currentPrice.formatBRL
      ? existingProduct.currentPrice.formatBRL()
      : `R$ ${existingProduct.currentPrice.amount}`
    : 'R$ —';

  const lastSentText = existingProduct.lastDispatchedAt
    ? new Date(existingProduct.lastDispatchedAt).toLocaleDateString('pt-BR')
    : 'Nunca divulgado';

  const createdText = existingProduct.createdAt
    ? new Date(existingProduct.createdAt).toLocaleDateString('pt-BR')
    : 'Data não informada';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Oferta Semelhante Encontrada no Catálogo</h2>
              <p className="text-xs text-amber-300">
                Esta oferta já está cadastrada. Escolha como deseja proceder.
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Existing Product Summary Box */}
        <div className="my-4 rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex items-start gap-3">
            {existingProduct.images && existingProduct.images.length > 0 ? (
              <img
                src={existingProduct.images[0]}
                alt={existingProduct.title}
                className="h-16 w-16 rounded-lg object-cover bg-slate-900 p-1 shrink-0 border border-slate-800"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-600">
                <ShoppingBag className="h-6 w-6" />
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MarketplaceBadge marketplaceSlug={existingProduct.marketplaceSlug} />
                <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  {formattedPrice}
                </span>
              </div>
              <h4 className="font-bold text-xs text-white line-clamp-2">{existingProduct.title}</h4>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-900 pt-2.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-400" /> Cadastrado em: {createdText}
            </span>
            <span className="flex items-center gap-1">
              <Send className="h-3 w-3 text-purple-400" /> Envios: {existingProduct.dispatchCount || 0}x ({lastSentText})
            </span>
          </div>
        </div>

        {/* Info Note */}
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          A atualização de preço substitui o valor atual, preservando o histórico de envios e estatísticas da oferta.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-slate-800 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onForceCreateNew}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            className="text-xs"
          >
            Criar Nova Mesmo Assim
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onUpdateExisting}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            className="text-xs font-extrabold shadow-lg shadow-blue-600/20"
          >
            Atualizar Oferta Existente
          </Button>
        </div>
      </div>
    </div>
  );
};
