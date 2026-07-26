'use client';

import React from 'react';
import { FastImportBox } from '@/presentation/components/business/FastImportBox';
import { OfferScoreBadge } from '@/presentation/components/business/OfferScoreBadge';
import { ChannelCopyBox } from '@/presentation/components/business/ChannelCopyBox';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { useImportWorkflow } from '@/presentation/hooks/useImportWorkflow';
import { ShoppingBag, Zap, Clock, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const { importOffer, isLoading, data } = useImportWorkflow();

  const metrics = [
    { name: 'Produtos no Catálogo', value: '24', change: '+4 hoje', icon: ShoppingBag },
    { name: 'Ofertas Geradas', value: '48', change: '100% IA', icon: Sparkles },
    { name: 'Score Média de Oferta', value: '92/100', change: 'Excelente', icon: Zap },
    { name: 'Tempo Economizado', value: '14.5 hrs', change: 'Esta semana', icon: Clock },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Central Operacional do Afiliado</h1>
        <p className="text-sm text-slate-400">Assistente pessoal de produtividade para automação de ofertas.</p>
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
        <Card className="border-blue-500/40 bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-blue-300">Nova Oferta Gerada com Sucesso!</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Score das Ofertas Recentes</CardTitle>
            <CardDescription>Avaliação inteligente do potencial de conversão.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { title: 'Smartphone Xiaomi Redmi Note 13', score: 95, label: 'Excelente' },
              { title: 'Smart TV 55 4K UHD Samsung', score: 92, label: 'Excelente' },
              { title: 'Air Fryer Mondo 4L Inox', score: 88, label: 'Boa Oferta' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-xs font-medium text-slate-200 truncate max-w-[240px]">{item.title}</span>
                <OfferScoreBadge score={item.score} label={item.label} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
