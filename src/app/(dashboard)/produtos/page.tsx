'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { ExternalLink, Copy, Tag as TagIcon, ShoppingBag, Plus, Sparkles, Layers, Trash2, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/core/domain/entities/category.entity';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { Product } from '@/core/domain/entities/product.entity';
import { useAuth } from '@/presentation/context/AuthContext';
import { DeletionReason, SmartTrashService } from '@/core/domain/services/smart-trash.service';

export default function ProdutosPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Trash Modal State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletionReason, setDeletionReason] = useState<DeletionReason>('Oferta encerrada');
  const [showHighImpactWarn, setShowHighImpactWarn] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const categories = ['TODAS', ...PRODUCT_CATEGORIES];

  const loadProducts = async () => {
    try {
      const repo = new FirestoreProductRepository();
      const uid = user?.uid || 'guest';
      const list = await repo.findAll(uid);
      setProducts(list);
    } catch (err) {
      console.warn('Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  const handleOpenTrashModal = (prod: Product) => {
    setDeletingProduct(prod);
    setDeletionReason('Oferta encerrada');
    const isHigh = SmartTrashService.shouldWarnBeforeDeletion(0, 90);
    setShowHighImpactWarn(isHigh);
  };

  const handleConfirmMoveToTrash = async () => {
    if (!deletingProduct) return;
    setProcessing(true);

    try {
      const repo = new FirestoreProductRepository();
      const uid = user?.uid || 'guest';
      await repo.moveToTrash(deletingProduct.id, deletionReason, uid);

      setProducts(products.filter((p) => p.id !== deletingProduct.id));
      setSuccessMsg('Produto enviado para a lixeira com sucesso.');
      setDeletingProduct(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao mover produto para a lixeira:', err);
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = selectedCategory === 'TODAS'
    ? products
    : products.filter((p) => p.brand === selectedCategory || p.title.includes(selectedCategory));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-blue-400" />
            <span>Catálogo Inteligente de Produtos</span>
          </h1>
          <p className="text-sm text-slate-400">Produtos cadastrados automaticamente a partir de URLs dos marketplaces.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button size="sm" variant="primary" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Adicionar Produto por URL
            </Button>
          </Link>
          <Link href="/lote">
            <Button size="sm" variant="secondary" className="text-xs" leftIcon={<Layers className="h-3.5 w-3.5" />}>
              Importar em Lote
            </Button>
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Carregando seu catálogo real...</div>
      ) : filteredProducts.length === 0 ? (
        /* Clean Empty State */
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto mb-4">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Você ainda não possui produtos cadastrados.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Cole a URL de qualquer produto da Shopee, Mercado Livre, Amazon ou Magalu no Dashboard para cadastrá-lo automaticamente no seu catálogo.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="primary" size="sm" className="text-xs" leftIcon={<Sparkles className="h-3.5 w-3.5" />}>
                Importar 1º Produto Agora
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="p-5">
              <CardHeader className="mb-2 p-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="info" className="mb-2">{p.marketplaceSlug}</Badge>
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">Marca: {p.brand}</CardDescription>
                  </div>
                  <Badge variant="success">{p.discountPercentage?.value ? `${p.discountPercentage.value}% OFF` : 'OFERTA'}</Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0 pt-3">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-xl font-bold text-emerald-400">
                    {p.currentPrice ? (p.currentPrice.formatBRL ? p.currentPrice.formatBRL() : `R$ ${p.currentPrice.amount}`) : 'R$ 0,00'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs"
                    leftIcon={<Copy className="h-3.5 w-3.5" />}
                    onClick={() => navigator.clipboard.writeText(p.affiliateUrl?.url || p.originalUrl)}
                  >
                    Copiar Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                    onClick={() => window.open(p.affiliateUrl?.url || p.originalUrl, '_blank')}
                  >
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="text-xs p-2"
                    title="Mover para a Lixeira"
                    onClick={() => handleOpenTrashModal(p)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Mover para Lixeira */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-slate-900 border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Enviar este produto para a lixeira?</CardTitle>
                <button onClick={() => setDeletingProduct(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription className="text-xs mt-1 text-slate-300 font-semibold">{deletingProduct.title}</CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4 text-xs">
              {showHighImpactWarn && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Este produto possui histórico ativo. Ele será movido para a lixeira temporária.</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Selecione o motivo da exclusão:</label>
                <select
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value as DeletionReason)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Produto esgotado">Produto esgotado</option>
                  <option value="Oferta encerrada">Oferta encerrada</option>
                  <option value="Link inválido">Link inválido</option>
                  <option value="Produto duplicado">Produto duplicado</option>
                  <option value="Baixo desempenho">Baixo desempenho</option>
                  <option value="Outro">Outro motivo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDeletingProduct(null)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={processing}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={handleConfirmMoveToTrash}
                >
                  {processing ? 'Enviando...' : 'Confirmar Exclusão'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
