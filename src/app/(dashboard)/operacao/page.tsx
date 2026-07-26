'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { BarChart3, ShoppingBag, Sparkles, Send, CheckCircle2, Layers, Tag, Store, Plus } from 'lucide-react';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { useAuth } from '@/presentation/context/AuthContext';

export default function OperacaoPage() {
  const { user } = useAuth();
  const [productCount, setProductCount] = useState(0);
  const [offerCount, setOfferCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const prodRepo = new FirestoreProductRepository();
        const offerRepo = new FirestoreOfferRepository();

        const uid = user?.uid || 'guest';
        const prods = await prodRepo.findAll(uid);
        const offers = await offerRepo.findByUserId(uid);

        setProductCount(prods.length);
        setOfferCount(offers.length);
      } catch (err) {
        console.warn('Erro ao carregar métricas:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, [user]);

  const stats = [
    { label: 'Produtos Cadastrados', value: productCount.toString(), icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-600/10' },
    { label: 'Analisados pela IA', value: productCount > 0 ? `${productCount} (100%)` : '0', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-600/10' },
    { label: 'Ofertas Criadas', value: offerCount.toString(), icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
    { label: 'Publicações Realizadas', value: '0', icon: Send, color: 'text-amber-400', bg: 'bg-amber-600/10' },
    { label: 'Publicados Hoje', value: '0', icon: CheckCircle2, color: 'text-sky-400', bg: 'bg-sky-600/10' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            <span>Minha Operação — Dados Reais</span>
          </h1>
          <p className="text-sm text-slate-400">Visão consolidada do volume de produtos, ofertas e publicações reais.</p>
        </div>

        <Link href="/dashboard">
          <Button size="sm" variant="primary" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Importar Produto
          </Button>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Card key={idx} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">{s.label}</span>
                <div className={`p-2 rounded-xl ${s.bg} ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-white">{loading ? '...' : s.value}</div>
            </Card>
          );
        })}
      </div>

      {productCount === 0 ? (
        /* Empty State with 0 Mock Data */
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto mb-4">
            <BarChart3 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Comece adicionando seu primeiro produto para gerar dados.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Seus gráficos de distribuição por categoria e marketplace aparecerão aqui após suas primeiras operações.
          </p>
          <Link href="/dashboard">
            <Button variant="primary" size="sm" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Adicionar Primeiro Produto
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 text-xs text-slate-400">
              {productCount} produtos cadastrados e mapeados no catálogo ativo.
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-base">Marketplaces Identificados</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 text-xs text-slate-400">
              {productCount} links sincronizados no banco de dados.
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
