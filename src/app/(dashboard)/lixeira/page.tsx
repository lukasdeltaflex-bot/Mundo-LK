'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { MarketplaceBadge } from '@/presentation/components/business/MarketplaceBadge';
import { Trash2, RefreshCw, CheckCircle2, History, Loader2 } from 'lucide-react';
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

  const loadTrashed = async () => {
    try {
      const repo = new FirestoreProductRepository();
      const uid = user?.uid || 'guest';
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

  const handleRestore = async (id: string) => {
    const item = trashedItems.find((t) => t.id === id);
    if (!item) return;

    try {
      const repo = new FirestoreProductRepository();
      await repo.restoreFromTrash(id);

      setTrashedItems(trashedItems.filter((t) => t.id !== id));
      setSuccessMsg(`O produto "${item.title}" foi restaurado com sucesso para o catálogo ativo!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao restaurar produto:', err);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    const item = trashedItems.find((t) => t.id === id);
    if (!item) return;

    if (confirm(`Tem certeza que deseja excluir definitivamente "${item.title}"? Esta ação é irreversível.`)) {
      try {
        const repo = new FirestoreProductRepository();
        await repo.delete(id);

        setTrashedItems(trashedItems.filter((t) => t.id !== id));
        setSuccessMsg(`O produto foi excluído definitivamente do Firebase.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        console.error('Erro ao excluir definitivamente:', err);
      }
    }
  };

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-red-400" />
            <span>Lixeira Inteligente & Recuperação de Produtos</span>
          </h1>
          <p className="text-sm text-slate-400">Produtos excluídos temporariamente são mantidos no banco com todo o histórico e nota de IA intactos.</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800">
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
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-5 border-slate-800 bg-slate-900/90">
              <CardHeader className="p-0 mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MarketplaceBadge marketplaceSlug={item.marketplace} />
                      <Badge variant="neutral">{item.category}</Badge>
                      <Badge variant="danger">Excluído</Badge>
                    </div>
                    <CardTitle className="text-base text-white">{item.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Excluído em: <strong className="text-slate-300">{item.deletedAt}</strong> | Motivo: <strong className="text-amber-400">{item.deletionReason}</strong>
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                      leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                      onClick={() => handleRestore(item.id)}
                    >
                      Restaurar Produto
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="text-xs"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => handlePermanentDelete(item.id)}
                    >
                      Excluir Definitivamente
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 space-y-3 text-xs">
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
          ))}
        </div>
      )}
    </div>
  );
}
