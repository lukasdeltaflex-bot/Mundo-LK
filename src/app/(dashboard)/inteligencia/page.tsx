'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { BrainCircuit, TrendingUp, Clock, Target } from 'lucide-react';

export default function InteligenciaPage() {
  const insights = [
    { title: 'Melhor Horário para Postar', value: '11:30 - 13:00', desc: 'Horário de maior conversão em grupos do WhatsApp', icon: Clock },
    { title: 'CTA com Maior Conversão', value: '🔥 IMPERDÍVEL + Link', desc: '+42% de cliques em relação a textos padrão', icon: Target },
    { title: 'Marketplace Mais Rentável', value: 'Shopee Brasil', desc: '64% do volume de ofertas compartilhadas este mês', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-blue-400" />
          <span>Smart Offer Intelligence</span>
        </h1>
        <p className="text-sm text-slate-400">Aprendizado contínuo baseado no seu histórico operacional.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="p-5">
              <CardHeader className="p-0 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{item.title}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-xl font-bold text-white mb-1">{item.value}</div>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recomendações Personalizadas para o seu Perfil</CardTitle>
          <CardDescription>Sugestões da IA para maximizar suas conversões.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-4">
            <h4 className="text-sm font-semibold text-blue-300">Aumente os envios de Eletrônicos às terças-feiras</h4>
            <p className="text-xs text-slate-400 mt-1">Seu público apresenta taxa de cliques 35% superior em eletrônicos no meio da semana.</p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-4">
            <h4 className="text-sm font-semibold text-emerald-300">Utilize negrito no preço inicial</h4>
            <p className="text-xs text-slate-400 mt-1">Textos formatados com destaque de valor no WhatsApp convertem mais rápido.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
