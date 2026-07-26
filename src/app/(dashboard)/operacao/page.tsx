'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { BarChart3, ShoppingBag, Sparkles, Send, CheckCircle2, TrendingUp, Layers, Tag, Store } from 'lucide-react';

export default function OperacaoPage() {
  const stats = [
    { label: 'Produtos Cadastrados', value: '48', icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-600/10' },
    { label: 'Analisados pela IA', value: '48 (100%)', icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-600/10' },
    { label: 'Ofertas Criadas', value: '142', icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-600/10' },
    { label: 'Publicações Realizadas', value: '389', icon: Send, color: 'text-amber-400', bg: 'bg-amber-600/10' },
    { label: 'Publicados Hoje', value: '14', icon: CheckCircle2, color: 'text-sky-400', bg: 'bg-sky-600/10' },
  ];

  const categoriesData = [
    { name: 'Eletrônicos', percentage: 42, count: 20 },
    { name: 'Casa e Cozinha', percentage: 25, count: 12 },
    { name: 'Celulares', percentage: 18, count: 9 },
    { name: 'Beleza & Perfumes', percentage: 15, count: 7 },
  ];

  const marketplacesData = [
    { name: 'Shopee', count: 18, color: 'bg-orange-500' },
    { name: 'Mercado Livre', count: 16, color: 'bg-yellow-400' },
    { name: 'Amazon BR', count: 10, color: 'bg-blue-400' },
    { name: 'Magalu', count: 4, color: 'bg-sky-400' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-400" />
          <span>Minha Operação — Dashboard de Afiliado</span>
        </h1>
        <p className="text-sm text-slate-400">Visão consolidada do volume de trabalho, publicações e engajamento da IA.</p>
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
              <div className="text-xl font-bold text-white">{s.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Charts / Distribution Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories Breakdown */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-400" />
              <CardTitle className="text-base">Distribuição por Categoria</CardTitle>
            </div>
            <CardDescription className="text-xs">Categorias com maior volume de produtos e ofertas</CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4 text-xs">
            {categoriesData.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span>{cat.name} ({cat.count} produtos)</span>
                  <span className="text-blue-400 font-bold">{cat.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Marketplace Distribution */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-base">Marketplaces Mais Utilizados</CardTitle>
            </div>
            <CardDescription className="text-xs">Origem dos links cadastrados na operação</CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4 text-xs">
            {marketplacesData.map((mp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${mp.color}`} />
                  <span className="font-semibold text-white">{mp.name}</span>
                </div>
                <Badge variant="info">{mp.count} links</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
