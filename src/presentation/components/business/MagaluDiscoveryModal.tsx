'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, Loader2, CheckCircle2, AlertTriangle, ExternalLink,
  ShoppingBag, Check, ShieldCheck, Tag
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ProductExtractionResult } from '@/core/domain/entities/ProductExtractionResult';
import { DiscoverMagaluOffersUseCase } from '@/core/application/use-cases/discovery/DiscoverMagaluOffersUseCase';
import { PublishingService } from '@/app/(dashboard)/operacao/services/PublishingService';
import { useAuth } from '@/presentation/context/AuthContext';

import { ChannelContent } from '@/core/domain/value-objects/channel-content.vo';

export interface MagaluDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type DiscoveryStage = 'IDLE' | 'DISCOVERING' | 'CURATION' | 'IMPORTING' | 'SUCCESS';

export const MagaluDiscoveryModal: React.FC<MagaluDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [stage, setStage] = useState<DiscoveryStage>('IDLE');
  const [candidates, setCandidates] = useState<ProductExtractionResult[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [affiliateTag, setAffiliateTag] = useState<string>('');
  const [feedUrl, setFeedUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setStage('IDLE');
      setCandidates([]);
      setSelectedIndices(new Set());
      setErrorMessage(null);
      setImportedCount(0);
      
      // Carrega affiliateTag salva do localStorage se disponível
      const savedTag = localStorage.getItem('magalu_affiliate_tag') || '';
      setAffiliateTag(savedTag);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartDiscovery = async () => {
    setStage('DISCOVERING');
    setErrorMessage(null);

    try {
      const useCase = new DiscoverMagaluOffersUseCase();
      const results = await useCase.execute({ limit: 20, feedUrl });

      if (results.length === 0) {
        setErrorMessage('Não foi possível obter candidatos reais do Magalu neste momento.');
        setStage('IDLE');
        return;
      }

      setCandidates(results);
      // Por padrão, seleciona todos os candidatos reais validados
      setSelectedIndices(new Set(results.map((_, i) => i)));
      setStage('CURATION');
    } catch (err: any) {
      console.error('[MagaluDiscoveryModal] Erro na descoberta:', err);
      setErrorMessage(err.message || 'Falha ao executar a descoberta de ofertas.');
      setStage('IDLE');
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIndices.size === candidates.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(candidates.map((_, i) => i)));
    }
  };

  const handleToggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const handleImportSelected = async () => {
    // FASE 6: Verificação Obrigatória da Affiliate Tag
    if (!affiliateTag || !affiliateTag.trim()) {
      setErrorMessage('Configure sua identificação de afiliado Magalu antes de importar ofertas.');
      return;
    }

    if (!user) {
      setErrorMessage('Usuário não autenticado.');
      return;
    }

    // Salva a tag para usos futuros
    localStorage.setItem('magalu_affiliate_tag', affiliateTag.trim());

    setStage('IMPORTING');
    setErrorMessage(null);
    let count = 0;

    const publishingService = new PublishingService();

    try {
      const selectedList = candidates.filter((_, idx) => selectedIndices.has(idx));

      for (const item of selectedList) {
        // Formata a URL de afiliado com partner_id
        const cleanUrl = item.originalUrl.split('?')[0];
        const affiliateUrl = `${cleanUrl}?partner_id=${affiliateTag.trim()}`;
        item.originalUrl = cleanUrl;
        item.canonicalUrl = cleanUrl;

        const copyText = `🔥 *OFERTA MAGALU IMPERDÍVEL!*\n\n📦 *${item.title}*\n\n💰 Por apenas: *R$ ${item.currentPrice?.toFixed(2)}*\n\n👉 Garanta no link oficial:\n${affiliateUrl}`;

        await publishingService.saveProductAndOffer(
          item,
          {
            scoreValue: 92,
            scoreLabel: 'EXCELLENT',
            scoreJustification: 'Oferta descoberta e aprovada no Magalu Affiliate Discovery Engine',
            copies: ChannelContent.create({
              whatsAppText: copyText,
              telegramText: copyText,
              longText: copyText,
            }),
            marketplaceId: 'magalu',
            marketplaceName: 'Magazine Luiza',
          },
          user.uid
        );

        count++;
        setImportedCount(count);
      }

      setStage('SUCCESS');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('[MagaluDiscoveryModal] Erro na importação:', err);
      setErrorMessage(err.message || 'Ocorreu um erro durante a importação dos candidatos.');
      setStage('CURATION');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Magalu Affiliate Discovery Engine
                <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-black text-blue-400 border border-blue-500/30">
                  Descoberta Automática
                </span>
              </h3>
              <p className="text-xs text-slate-400">Varredura de ofertas reais do Magazine Luiza e curadoria de candidatos.</p>
            </div>
          </div>

          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Mensagem de Erro / Alerta */}
          {errorMessage && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3 text-xs text-red-300">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <div className="flex-1 font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Configuração de Tag de Afiliado & Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Tag className="h-3.5 w-3.5 text-blue-400" /> Identificação de Afiliado (partner_id Magalu)
              </label>
              <input
                type="text"
                value={affiliateTag}
                onChange={(e) => setAffiliateTag(e.target.value)}
                placeholder="Ex: minhalojaafiliada"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Obrigatório para transformar candidatos em links de parceiro Magalu.</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-purple-400" /> URL do Feed XML/JSON (Opcional)
              </label>
              <input
                type="text"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="Deixe em branco para varrer ofertas públicas em alta"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">URL direta do feed exportado do Parceiro Magalu / Magazine Você.</span>
            </div>
          </div>

          {/* ESTADO 1: DISCOVERING (Carregando) */}
          {stage === 'DISCOVERING' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
              <h4 className="text-sm font-bold text-white">Executando Descoberta Automática Magalu...</h4>
              <p className="text-xs text-slate-400 max-w-md">Varrendo ofertas em alta e validando estrutura de títulos, preços e imagens reais.</p>
            </div>
          )}

          {/* ESTADO 2: CURATION (Tabela de Candidatos) */}
          {stage === 'CURATION' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Candidatos Encontrados: <strong className="text-blue-400">{candidates.length}</strong> (Selecionados: {selectedIndices.size})
                </span>

                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                >
                  {selectedIndices.size === candidates.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>

              {/* Tabela de Produtos Candidatos */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold text-[11px] uppercase">
                      <th className="py-3 px-3 text-center w-10">#</th>
                      <th className="py-3 px-3">Produto</th>
                      <th className="py-3 px-3 text-right">Preço</th>
                      <th className="py-3 px-3 text-center">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {candidates.map((c, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleToggleSelect(idx)}
                        className={`cursor-pointer transition hover:bg-slate-800/40 ${
                          selectedIndices.has(idx) ? 'bg-blue-600/10' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIndices.has(idx)}
                            onChange={() => handleToggleSelect(idx)}
                            className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={c.image}
                              alt={c.title}
                              className="h-10 w-10 rounded-xl object-contain bg-slate-900 p-1 shrink-0 border border-slate-800"
                            />
                            <span className="font-bold text-white line-clamp-1 max-w-sm">{c.title}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span className="font-extrabold text-emerald-400 block">
                            R$ {c.currentPrice ? c.currentPrice.toFixed(2) : '---'}
                          </span>
                          {c.originalPrice && (
                            <span className="text-[10px] text-slate-500 line-through block">
                              R$ {c.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <a
                            href={c.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ESTADO 3: IMPORTING */}
          {stage === 'IMPORTING' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
              <h4 className="text-sm font-bold text-white">Importando Ofertas para o Catalogo Oficial...</h4>
              <p className="text-xs text-slate-400">
                Processados {importedCount} de {selectedIndices.size} produtos selecionados no pipeline oficial.
              </p>
            </div>
          )}

          {/* ESTADO SUCCESSO */}
          {stage === 'SUCCESS' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center animate-in fade-in duration-200">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-base font-extrabold text-white">Descoberta & Importação Concluídas!</h4>
              <p className="text-xs text-slate-300">
                <strong className="text-emerald-400">{importedCount}</strong> novas ofertas Magalu foram geradas e salvas com sucesso no catálogo.
              </p>
              <Button onClick={onClose} variant="primary" size="sm" className="mt-2">
                Concluir & Ver Produtos
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/60 flex items-center justify-between">
          {stage === 'IDLE' && (
            <>
              <Button type="button" variant="secondary" size="sm" onClick={onClose} className="text-xs">
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleStartDiscovery}
                className="text-xs bg-blue-600 hover:bg-blue-500"
              >
                <Sparkles className="h-4 w-4 mr-1" /> Iniciar Descoberta
              </Button>
            </>
          )}

          {stage === 'CURATION' && (
            <>
              <Button type="button" variant="secondary" size="sm" onClick={() => setStage('IDLE')} className="text-xs">
                Refazer Busca
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleImportSelected}
                disabled={selectedIndices.size === 0}
                className="text-xs bg-emerald-600 hover:bg-emerald-500"
              >
                <ShieldCheck className="h-4 w-4 mr-1" /> Importar {selectedIndices.size} Selecionados
              </Button>
            </>
          )}

          {(stage === 'DISCOVERING' || stage === 'IMPORTING') && (
            <div className="text-xs text-slate-400 font-mono w-full text-center">Processando... por favor aguarde</div>
          )}
        </div>
      </div>
    </div>
  );
};
