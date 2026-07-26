'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { OfferScoreBadge } from '@/presentation/components/business/OfferScoreBadge';
import { ChannelCopyBox } from '@/presentation/components/business/ChannelCopyBox';

export default function OfertasPage() {
  const offers = [
    {
      id: 'off_1',
      title: 'Smartphone Xiaomi Redmi Note 13 256GB 8GB RAM',
      price: 'R$ 1.199,00',
      score: 95,
      scoreLabel: 'Excelente',
      justification: 'Menor valor nos últimos 90 dias com desconto de 36% e frete grátis na loja oficial.',
      whatsAppText: '🔥 *OFERTA IMPERDÍVEL!*\n\n*Smartphone Xiaomi Redmi Note 13*\n\n💰 Por apenas: *R$ 1.199,00* (36% OFF)\n\n🛒 *Compre aqui:* https://shopee.com.br/...',
      telegramText: '🔥 <b>OFERTA RELÂMPAGO!</b>\n\n<b>Smartphone Xiaomi Redmi Note 13</b>\n\nPor: <b>R$ 1.199,00</b>\n\n🔗 <a href="https://shopee.com.br/...">CLIQUE PARA COMPRAR</a>',
      instagramText: '🔥 Baixou demais! Smartphone Xiaomi Redmi Note 13 por R$ 1.199,00! Link no story e bio!',
      affiliateUrl: 'https://shopee.com.br/...',
    },
    {
      id: 'off_2',
      title: 'Fritadeira Eletrica Air Fryer Mondo 4L Inox',
      price: 'R$ 299,90',
      score: 88,
      scoreLabel: 'Boa Oferta',
      justification: 'Desconto de 40% verificado no Mercado Livre Direct.',
      whatsAppText: '⚡ *AIR FRYER EM PROMOÇÃO!*\n\n*Air Fryer Mondo 4L Inox*\n\n💰 Por apenas: *R$ 299,90*\n\n🛒 *Compre aqui:* https://mercadolivre.com.br/...',
      telegramText: '⚡ <b>AIR FRYER MONDO 4L</b>\n\nPor: <b>R$ 299,90</b>\n\n🔗 <a href="https://mercadolivre.com.br/...">COMPRAR AGORA</a>',
      instagramText: '⚡ Air Fryer Mondo 4L Inox por R$ 299,90! Confira no link da bio!',
      affiliateUrl: 'https://mercadolivre.com.br/...',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Central de Ofertas & Copy Editor</h1>
        <p className="text-sm text-slate-400">Ofertas prontas geradas por IA com cópias em 1-clique para todas as redes sociais.</p>
      </div>

      <div className="space-y-6">
        {offers.map((o) => (
          <Card key={o.id} className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{o.title}</CardTitle>
                  <CardDescription className="text-emerald-400 font-bold text-base mt-1">{o.price}</CardDescription>
                </div>
                <OfferScoreBadge score={o.score} label={o.scoreLabel} />
              </div>
              <p className="text-xs text-slate-400 mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                <span className="font-semibold text-blue-400">Diagnóstico da IA:</span> {o.justification}
              </p>
            </CardHeader>

            <CardContent className="p-0">
              <ChannelCopyBox
                whatsAppText={o.whatsAppText}
                telegramText={o.telegramText}
                instagramText={o.instagramText}
                affiliateUrl={o.affiliateUrl}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
