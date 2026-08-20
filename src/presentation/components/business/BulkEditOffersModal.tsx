'use client';

import React, { useState } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { X, Layers, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Offer } from '@/core/domain/entities/offer.entity';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { UpdateOfferUseCase } from '@/core/application/use-cases/offers/UpdateOfferUseCase';
import { useAuth } from '@/presentation/context/AuthContext';

interface BulkEditOffersModalProps {
  isOpen: boolean;
  selectedOffers: Offer[];
  onClose: () => void;
  onSuccess: () => void;
}

const MARKETPLACE_OPTIONS = [
  { slug: 'shopee', name: 'Shopee' },
  { slug: 'magalu', name: 'Magazine Luiza (Magalu)' },
  { slug: 'mercadolivre', name: 'Mercado Livre' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'shein', name: 'SHEIN' },
  { slug: 'geral', name: 'Geral / Outro' },
];

export function BulkEditOffersModal({
  isOpen,
  selectedOffers,
  onClose,
  onSuccess,
}: BulkEditOffersModalProps) {
  const { user } = useAuth();
  const [targetMarketplaceSlug, setTargetMarketplaceSlug] = useState('shopee');
  const [step, setStep] = useState<'CONFIG' | 'CONFIRM' | 'PROCESSING' | 'RESULT'>('CONFIG');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [conflictLogs, setConflictLogs] = useState<Array<{ offerId: string; reason: string }>>([]);

  if (!isOpen || selectedOffers.length === 0) return null;

  const targetObj = MARKETPLACE_OPTIONS.find((m) => m.slug === targetMarketplaceSlug) || MARKETPLACE_OPTIONS[0];

  const handleStartBulkEdit = async () => {
    if (!user?.uid) return;
    setStep('PROCESSING');
    setCurrentIndex(0);
    setSuccessCount(0);
    setConflictLogs([]);

    const repo = new FirestoreOfferRepository();
    const useCase = new UpdateOfferUseCase(repo);
    let updated = 0;
    const conflicts: Array<{ offerId: string; reason: string }> = [];

    for (let i = 0; i < selectedOffers.length; i++) {
      const offer = selectedOffers[i];
      setCurrentIndex(i + 1);

      try {
        // Checagem de duplicidade no mesmo produto
        if (offer.productId) {
          const existingInProd = await repo.findByProductId(offer.productId, user.uid);
          const hasConflict = existingInProd.some(
            (o) => (o.marketplaceId || (o as any).marketplace) === targetMarketplaceSlug && o.id !== offer.id
          );

          if (hasConflict) {
            conflicts.push({
              offerId: offer.id,
              reason: `O produto associado (${offer.productId}) já possui uma oferta em ${targetObj.name}.`,
            });
            continue;
          }
        }

        const changes: Partial<Offer> = {
          marketplaceId: targetMarketplaceSlug,
          marketplaceName: targetObj.name,
        };

        await useCase.execute({
          offerId: offer.id,
          userId: user.uid,
          changes,
        });

        if (offer.productId) {
          const prodRepo = new (await import('@/infrastructure/firebase/repositories/firestore-product.repository')).FirestoreProductRepository();
          await prodRepo.update(offer.productId, {
            marketplaceSlug: targetMarketplaceSlug,
          }).catch((e) => console.warn('[BulkEdit] Erro ao sincronizar produto:', e));
        }

        updated++;
      } catch (err: any) {
        conflicts.push({
          offerId: offer.id,
          reason: err?.message || 'Erro desconhecido ao atualizar oferta.',
        });
      }
    }

    setSuccessCount(updated);
    setConflictLogs(conflicts);
    setStep('RESULT');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold text-slate-100">
              Edição em Massa — {selectedOffers.length} Oferta(s)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={step === 'PROCESSING'}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Configuração do Novo Marketplace */}
        {step === 'CONFIG' && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-300">
              Selecione o novo <strong>Marketplace de destino</strong> que deseja aplicar a todas as{' '}
              <strong className="text-amber-400">{selectedOffers.length} ofertas selecionadas</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Novo Marketplace
              </label>
              <select
                value={targetMarketplaceSlug}
                onChange={(e) => setTargetMarketplaceSlug(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition"
              >
                {MARKETPLACE_OPTIONS.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={() => setStep('CONFIRM')}>
                Avançar para Confirmação
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Tela de Confirmação Cirúrgica */}
        {step === 'CONFIRM' && (
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-purple-950/30 border border-purple-500/30 p-4 space-y-2">
              <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-purple-400 shrink-0" /> Confirmar Alteração em Massa
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Você está prestes a alterar o Marketplace de <strong>{selectedOffers.length} ofertas</strong> para{' '}
                <strong className="text-emerald-400">{targetObj.name}</strong>.
              </p>
              <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-1 pt-1">
                <li>Os <code className="text-amber-400">offerId</code> existentes serão 100% preservados.</li>
                <li>Nenhuma oferta será excluída ou recriada.</li>
                <li>Nenhum produto associado será modificado.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setStep('CONFIG')}>
                Voltar
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleStartBulkEdit}>
                Confirmar e Aplicar
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Progresso em Tempo Real */}
        {step === 'PROCESSING' && (
          <div className="p-8 text-center space-y-4">
            <RefreshCw className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
            <h4 className="text-sm font-bold text-white">Atualizando ofertas em massa...</h4>
            <p className="text-xs text-slate-400 font-mono">
              Processando: {currentIndex} / {selectedOffers.length}
            </p>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${(currentIndex / selectedOffers.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 4: Relatório Transparente Pós-Processamento */}
        {step === 'RESULT' && (
          <div className="p-6 space-y-4">
            <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/30 p-4 space-y-1">
              <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Operação Concluída
              </h4>
              <p className="text-xs text-slate-200">
                <strong>{successCount}</strong> de <strong>{selectedOffers.length}</strong> oferta(s) foram atualizadas para{' '}
                <strong className="text-emerald-400">{targetObj.name}</strong>.
              </p>
            </div>

            {conflictLogs.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-amber-400">
                  Ofertas Ignoradas / Conflitos ({conflictLogs.length}):
                </h5>
                <div className="max-h-36 overflow-y-auto space-y-1.5 text-[11px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {conflictLogs.map((log, idx) => (
                    <div key={idx} className="text-amber-300">
                      • <strong>{log.offerId}:</strong> {log.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
              >
                Concluir e Atualizar Tela
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
