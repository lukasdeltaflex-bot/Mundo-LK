'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { MarketplaceBadge } from '@/presentation/components/business/MarketplaceBadge';
import { Trash2, RefreshCw, CheckCircle2, History, Loader2, AlertTriangle, X } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/core/domain/entities/category.entity';
import { DeletionReason } from '@/core/domain/services/smart-trash.service';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { useAuth } from '@/presentation/context/AuthContext';

export interface UITrashedItem {
  id: string;
  title: string;
  category: string;
  marketplace: string;
  affiliateUrl: string;
  createdAt: string;
  deletedAt: string;
  deletionReason: string;
  publicationCount: number;
  aiScore: number;
  status: string;
}

export default function LixeiraPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedReason, setSelectedReason] = useState<string>('TODOS');
  const [trashedItems, setTrashedItems] = useState<UITrashedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estado de Seleção Múltipla & Modal de Segurança
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const loadTrashed = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    try {
      const repo = new FirestoreProductRepository();
      const uid = user.uid;
      const rawList = await repo.findTrashed(uid);

      const formatted: UITrashedItem[] = rawList.map((docItem) => ({
        id: docItem.id,
        title: docItem.title || 'Produto Sem Título',
        category: docItem.categoryId || 'Eletrônicos',
        marketplace: docItem.marketplaceSlug || 'Marketplace',
        affiliateUrl: docItem.affiliateUrl || docItem.originalUrl || '',
        createdAt: docItem.createdAt ? new Date(docItem.createdAt).toLocaleDateString('pt-BR') : 'Hoje',
        deletedAt: docItem.deletedAt ? new Date(docItem.deletedAt).toLocaleString('pt-BR') : 'Recentemente',
        deletionReason: docItem.deletionReason || 'Oferta encerrada',
        publicationCount: docItem.publicationCount || 0,
        aiScore: docItem.opportunityScore || 90,
        status: docItem.status || 'trashed',
      }));

      setTrashedItems(formatted);
    } catch (err) {
      console.warn('Erro ao carregar lixeira:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrashed();
  }, [user]);

  const reasonsList: Array<'TODOS' | DeletionReason> = [
    'TODOS',
    'Produto esgotado',
    'Oferta encerrada',
    'Link inválido',
    'Produto duplicado',
    'Baixo desempenho',
    'Outro',
  ];

  const filteredItems = trashedItems.filter((item) => {
    const matchCat = selectedCategory === 'TODAS' || item.category === selectedCategory;
    const matchReason = selectedReason === 'TODOS' || item.deletionReason === selectedReason;
    return matchCat && matchReason;
  });

  // Lógica de Seleção Múltipla
  const isAllSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id));

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  // Restauração Individual
  const handleRestore = async (id: string) => {
    const item = trashedItems.find((t) => t.id === id);
    if (!item) return;

    try {
      const repo = new FirestoreProductRepository();
      await repo.restoreFromTrash(id);

      setTrashedItems((prev) => prev.filter((t) => t.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      setSuccessMsg(`O produto "${item.title}" foi restaurado com sucesso para o catálogo ativo!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao restaurar produto:', err);
    }
  };

  // Restauração em Massa (Batch)
  const handleRestoreSelected = async () => {
    if (selectedIds.length === 0 || processingBatch) return;

    setProcessingBatch(true);
    try {
      const repo = new FirestoreProductRepository();
      const { restored, errors } = await repo.restoreManyFromTrash(selectedIds);

      setTrashedItems((prev) => prev.filter((t) => !restored.includes(t.id)));
      setSelectedIds((prev) => prev.filter((i) => !restored.includes(i)));

      if (errors.length === 0) {
        setSuccessMsg(`${restored.length} produto(s) restaurado(s) com sucesso para o catálogo!`);
      } else {
        setSuccessMsg(`${restored.length} produto(s) restaurado(s). ${errors.length} falharam.`);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Erro ao restaurar em lote:', err);
    } finally {
      setProcessingBatch(false);
    }
  };

  // Exclusão Permanente Individual
  const handlePermanentDelete = async (id: string) => {
    const item = trashedItems.find((t) => t.id === id);
    if (!item) return;

    if (confirm(`Tem certeza que deseja excluir definitivamente "${item.title}"? Esta ação é irreversível.`)) {
      try {
        const repo = new FirestoreProductRepository();
        await repo.delete(id);

        setTrashedItems((prev) => prev.filter((t) => t.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        setSuccessMsg(`O produto foi excluído definitivamente do banco de dados.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        console.error('Erro ao excluir definitivamente:', err);
      }
    }
  };

  // Exclusão Permanente em Massa (Batch)
  const handleConfirmDeleteSelected = async () => {
    if (selectedIds.length === 0 || processingBatch) return;

    setProcessingBatch(true);
    setShowDeleteModal(false);
    try {
      const repo = new FirestoreProductRepository();
      const { deleted, errors } = await repo.deleteManyPermanently(selectedIds);

      setTrashedItems((prev) => prev.filter((t) => !deleted.includes(t.id)));
      setSelectedIds((prev) => prev.filter((i) => !deleted.includes(i)));

      if (errors.length === 0) {
        setSuccessMsg(`${deleted.length} produto(s) excluído(s) definitivamente do banco de dados.`);
      } else {
        setSuccessMsg(`${deleted.length} produto(s) excluído(s). ${errors.length} falharam.`);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Erro ao excluir lote definitivamente:', err);
    } finally {
      setProcessingBatch(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-red-400" />
            <span>Lixeira Inteligente & Recuperação de Produtos</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Produtos excluídos temporariamente são mantidos no banco com todo o histórico e nota de IA intactos.</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters Bar & Actions */}
      <Card className="p-4 bg-slate-900/60 border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Filtrar por Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="TODAS">Todas as Categorias</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Filtrar por Motivo de Exclusão</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {reasonsList.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Toolbar de Ações em Massa */}
        {filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="selectAll" className="font-semibold text-slate-300 cursor-pointer">
                Selecionar Todos ({filteredItems.length})
              </label>

              {selectedIds.length > 0 && (
                <span className="bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold px-2 py-0.5 rounded-full text-[11px] ml-2">
                  {selectedIds.length} selecionado(s)
                </span>
              )}
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  disabled={processingBatch}
                  leftIcon={processingBatch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  onClick={handleRestoreSelected}
                >
                  Restaurar Selecionados ({selectedIds.length})
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="text-xs"
                  disabled={processingBatch}
                  leftIcon={processingBatch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => setShowDeleteModal(true)}
                >
                  Excluir Permanentemente ({selectedIds.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Trashed Items List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 text-xs">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
          Carregando lixeira inteligente...
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/10 text-red-400 border border-red-500/20 mx-auto mb-4">
            <Trash2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Sua lixeira inteligente está vazia.</h3>
          <p className="text-xs text-slate-400">Nenhum produto excluído temporariamente foi encontrado no banco de dados.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <Card key={item.id} className={`p-5 border-slate-800 transition-colors ${isSelected ? 'bg-slate-900/95 border-blue-500/50 ring-1 ring-blue-500/30' : 'bg-slate-900/90'}`}>
                <CardHeader className="p-0 mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(item.id)}
                        className="mt-1 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <MarketplaceBadge marketplaceSlug={item.marketplace} />
                          <Badge variant="neutral">{item.category}</Badge>
                          <Badge variant="danger">Excluído</Badge>
                        </div>
                        <CardTitle className="text-base text-white">{item.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Excluído em: <strong className="text-slate-300">{item.deletedAt}</strong> | Motivo: <strong className="text-amber-400">{item.deletionReason}</strong>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-7 sm:ml-0">
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                        leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                        onClick={() => handleRestore(item.id)}
                      >
                        Restaurar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="text-xs"
                        leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={() => handlePermanentDelete(item.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0 space-y-3 text-xs pl-7 sm:pl-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cadastrado em</span>
                      <span className="font-semibold text-slate-200">{item.createdAt}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Publicações Realizadas</span>
                      <span className="font-semibold text-blue-400">{item.publicationCount} vezes</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nota IA Preservada</span>
                      <span className="font-semibold text-emerald-400">{item.aiScore}/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE SEGURANÇA */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Exclusão Permanente em Massa</h3>
                  <p className="text-xs text-slate-400">Esta ação é irreversível.</p>
                </div>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 leading-relaxed">
              Tem certeza de que deseja excluir definitivamente <strong className="text-red-400 font-bold">{selectedIds.length} produto(s)</strong> selecionado(s)?
              <br /><br />
              Estes produtos serão removidos permanentemente do banco de dados e todo o seu histórico será apagado.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(false)} disabled={processingBatch}>
                Cancelar
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDeleteSelected}
                disabled={processingBatch}
                leftIcon={processingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              >
                {processingBatch ? 'Excluindo Lote...' : 'Excluir Definitivamente'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
