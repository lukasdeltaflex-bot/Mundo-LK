'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { X, Trash2, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Product } from '@/core/domain/entities/product.entity';
import { Offer } from '@/core/domain/entities/offer.entity';
import { DeletionReason, SmartTrashService } from '@/core/domain/services/smart-trash.service';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';

interface BulkDeleteModalProps {
  selectedProducts: Product[];
  offersMap: Record<string, Offer[]>;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deletedCount: number) => void;
}

export function BulkDeleteModal({
  selectedProducts,
  offersMap,
  userId,
  isOpen,
  onClose,
  onSuccess,
}: BulkDeleteModalProps) {
  const [deletionReason, setDeletionReason] = useState<DeletionReason>('Oferta encerrada');
  const [processing, setProcessing] = useState<boolean>(false);

  // Audit offer dependencies before deletion (Regra 15 da Autorização)
  const dependencyAudit = useMemo(() => {
    let productsWithOffersCount = 0;
    let totalLinkedOffersCount = 0;

    selectedProducts.forEach((prod) => {
      const linked = offersMap[prod.id] || [];
      if (linked.length > 0) {
        productsWithOffersCount++;
        totalLinkedOffersCount += linked.length;
      }
    });

    return {
      productsWithOffersCount,
      totalLinkedOffersCount,
    };
  }, [selectedProducts, offersMap]);

  if (!isOpen || selectedProducts.length === 0) return null;

  const handleConfirmBulkDelete = async () => {
    if (processing || !userId) return;
    setProcessing(true);

    try {
      const productRepo = new FirestoreProductRepository();
      const productIds = selectedProducts.map((p) => p.id);

      await productRepo.moveManyToTrash(productIds, deletionReason, userId);

      onSuccess(selectedProducts.length);
      onClose();
    } catch (err) {
      console.error('Erro ao mover produtos em massa para a lixeira:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-400" />
            <h3 className="font-semibold text-slate-100">Excluir Produtos Selecionados?</h3>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-300">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">
                Você está prestes a mover <span className="text-amber-400 font-extrabold">{selectedProducts.length} produtos</span> para a Lixeira inteligente.
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Esta ação altera o status dos produtos para <span className="font-mono font-bold text-slate-200">TRASHED</span> e permite restauração a qualquer momento.
              </p>
            </div>
          </div>

          {/* Offer Integrity Guard Audit Summary (Regra 15 e 16 da Autorização) */}
          {dependencyAudit.productsWithOffersCount > 0 ? (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 flex items-start gap-3 text-xs text-blue-300">
              <ShieldAlert className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-0.5">Política de Integridade do Catálogo (0 Ofertas Órfãs)</p>
                <p className="text-[11px] text-blue-200 leading-relaxed">
                  <span className="font-bold text-white">{dependencyAudit.productsWithOffersCount} produtos</span> possuem{' '}
                  <span className="font-bold text-emerald-400">{dependencyAudit.totalLinkedOffersCount} ofertas vinculadas</span>.
                  As ofertas serão <span className="underline font-semibold">100% preservadas</span> no histórico e nenhum vínculo será corrompido.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Nenhum dos produtos selecionados possui ofertas ativas vinculadas.</span>
            </div>
          )}

          {/* Deletion Reason Selector (Reutiliza taxonomia existente - Regra 18) */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-medium text-slate-300 block">Selecione o motivo da exclusão:</label>
            <select
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value as DeletionReason)}
              disabled={processing}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Oferta encerrada">Oferta encerrada</option>
              <option value="Produto esgotado">Produto esgotado</option>
              <option value="Link inválido">Link inválido</option>
              <option value="Produto duplicado">Produto duplicado</option>
              <option value="Baixo desempenho">Baixo desempenho</option>
              <option value="Outro">Outro motivo</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4 bg-slate-950/40">
          <Button variant="outline" size="sm" onClick={onClose} disabled={processing}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirmBulkDelete}
            disabled={processing}
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
          >
            {processing ? 'Excluindo...' : 'Mover para a Lixeira'}
          </Button>
        </div>
      </div>
    </div>
  );
}
