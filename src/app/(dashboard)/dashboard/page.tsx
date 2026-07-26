'use client';

import React from 'react';
import { FastImportBox } from '@/presentation/components/business/FastImportBox';
import { OfferScoreBadge } from '@/presentation/components/business/OfferScoreBadge';
import { ChannelCopyBox } from '@/presentation/components/business/ChannelCopyBox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { useImportWorkflow } from '@/presentation/hooks/useImportWorkflow';
import { useAuth } from '@/presentation/context/AuthContext';
import { ShoppingBag, Zap, Clock, Sparkles, Activity } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { importOffer, isLoading, data } = useImportWorkflow();

  const metrics = [
    { name: 'Produtos no Catálogo', value: '24', change: '+4 hoje', icon: ShoppingBag },
    { name: 'Ofertas Geradas', value: '48', change: '100% IA', icon: Sparkles },
    { name: 'Score Média de Oferta', value: '92/100', change: 'Excelente', icon: Zap },
    { name: 'Economia de Tempo', value: '14.5 hrs', change: 'Esta semana', icon: Clock },
  ];

  const activities = [
    { text: 'Oferta do Smartphone Xiaomi gerada com Gemini Flash 2.5', time: 'Há 5 minutos' },
    { text: 'Preço da Air Fryer Mondo sincronizado via Mercado Livre Adapter', time: 'Há 18 minutos' },
    { text: 'Cópia formatada para WhatsApp exportada para a área de transferência', time: 'Há 42 minutos' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Olá, {user?.name || 'Afiliado'}! Bem-vindo ao Mundo LK.</span>
          <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Seu Centro Inteligente de Gestão de Ofertas e Automação para Afiliados de Marketplaces.
        </p>
      </div>

      {/* Fast Import Box */}
      <FastImportBox
        isLoading={isLoading}
        onImport={async (formData) => {
          await importOffer({ url: formData.url, affiliateTag: formData.affiliateTag });
        }}
      />

      {/* Generated Result Preview */}
      {data && (
        <Card className="border-blue-500/40 bg-blue-950/20 animate-in fade-in duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-blue-300">Nova Oferta Gerada com Sucesso no Mundo LK!</CardTitle>
                <CardDescription>{data.title}</CardDescription>
              </div>
              <OfferScoreBadge score={data.score} label={data.scoreLabel} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xl font-bold text-emerald-400">{data.price}</div>
            <ChannelCopyBox
              whatsAppText={data.whatsappText}
              telegramText={data.telegramText}
              instagramText={data.instagramText}
              affiliateUrl={data.whatsappText}
            />
          </CardContent>
        </Card>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.name} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{m.name}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{m.value}</span>
                <span className="text-[11px] font-medium text-emerald-400">{m.change}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Produtos Importados</CardTitle>
            <CardDescription>Produtos cadastrados recentemente no seu catálogo inteligente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { title: 'Smartphone Xiaomi Redmi Note 13', store: 'Shopee', price: 'R$ 1.199,00', discount: '36% OFF' },
              { title: 'Air Fryer Mondo 4L Inox', store: 'Mercado Livre', price: 'R$ 299,90', discount: '40% OFF' },
              { title: 'Fone de Ouvido Bluetooth ANC', store: 'Amazon BR', price: 'R$ 349,00', discount: '41% OFF' },
            ].map((p, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <div>
                  <h4 className="text-xs font-semibold text-white">{p.title}</h4>
                  <span className="text-[11px] text-slate-400">{p.store}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">{p.price}</span>
                  <Badge variant="success" className="ml-2 text-[10px] py-0 px-1.5">{p.discount}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Latest Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              <CardTitle>Últimas Atividades do Sistema</CardTitle>
            </div>
            <CardDescription>Auditoria imutável de eventos registrados em tempo real.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.map((act, idx) => (
              <div key={idx} className="flex items-start justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs text-slate-300 font-medium">{act.text}</p>
                <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{act.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
