'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { OfferScoreBadge } from '@/presentation/components/business/OfferScoreBadge';
import { ChannelCopyBox } from '@/presentation/components/business/ChannelCopyBox';
import { OfferRatingWidget } from '@/presentation/components/business/OfferRatingWidget';
import { MarketplaceBadge } from '@/presentation/components/business/MarketplaceBadge';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Edit3, Copy, Save, Layers, Clock, AlertTriangle, History } from 'lucide-react';

export default function OfertasPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [warningId, setWarningId] = useState<string | null>(null);

  const [offers, setOffers] = useState([
    {
      id: 'off_1',
      title: 'Smartphone Xiaomi Redmi Note 13 256GB 8GB RAM',
      marketplace: 'Shopee',
      price: 'R$ 1.199,00',
      status: 'REPUBLICADO' as const,
      publicationCount: 3,
      lastPublishedAt: '26/07/2026 11:00',
      score: 95,
      scoreLabel: 'Excelente',
      justification: 'Menor valor nos últimos 90 dias com desconto de 36% e frete grátis na loja oficial.',
      cta: '👉 Clique aqui para aproveitar a oferta auditada pela IA!',
      benefits: '• Tela AMOLED 120Hz\n• Câmera Tripla de 108MP\n• Carregamento Rápido 33W',
      hashtags: '#xiaomi #redminote13 #oferta #mundolk',
      whatsAppText: '🔥 *OFERTA IMPERDÍVEL!*\n\n*Smartphone Xiaomi Redmi Note 13*\n\n💰 Por apenas: *R$ 1.199,00* (36% OFF)\n\n🛒 *Compre aqui:* https://shopee.com.br/...',
      telegramText: '🔥 <b>OFERTA RELÂMPAGO!</b>\n\n<b>Smartphone Xiaomi Redmi Note 13</b>\n\nPor: <b>R$ 1.199,00</b>\n\n🔗 <a href="https://shopee.com.br/...">CLIQUE PARA COMPRAR</a>',
      instagramText: '🔥 Baixou demais! Smartphone Xiaomi Redmi Note 13 por R$ 1.199,00! Link no story e bio!',
      affiliateUrl: 'https://shopee.com.br/...',
      history: [
        { date: '26/07/2026 10:30', text: 'Produto adicionado ao catálogo' },
        { date: '26/07/2026 11:00', text: 'Publicado no WhatsApp' },
        { date: '27/07/2026 09:20', text: 'Republicado no Telegram' },
      ],
    },
    {
      id: 'off_2',
      title: 'Fritadeira Eletrica Air Fryer Mondo 4L Inox',
      marketplace: 'Mercado Livre',
      price: 'R$ 299,90',
      status: 'ADICIONADO' as const,
      publicationCount: 0,
      lastPublishedAt: 'Nunca',
      score: 88,
      scoreLabel: 'Boa Oferta',
      justification: 'Desconto de 40% verificado no Mercado Livre Direct.',
      cta: '⚡ Garanta a sua com desconto especial!',
      benefits: '• Capacidade de 4 Litros\n• Painel Digital Touch\n• Cesto Removível Antiaderente',
      hashtags: '#airfryer #cozinha #promocao #mundolk',
      whatsAppText: '⚡ *AIR FRYER EM PROMOÇÃO!*\n\n*Air Fryer Mondo 4L Inox*\n\n💰 Por apenas: *R$ 299,90*\n\n🛒 *Compre aqui:* https://mercadolivre.com.br/...',
      telegramText: '⚡ <b>AIR FRYER MONDO 4L</b>\n\nPor: <b>R$ 299,90</b>\n\n🔗 <a href="https://mercadolivre.com.br/...">COMPRAR AGORA</a>',
      instagramText: '⚡ Air Fryer Mondo 4L Inox por R$ 299,90! Confira no link da bio!',
      affiliateUrl: 'https://mercadolivre.com.br/...',
      history: [
        { date: '26/07/2026 12:15', text: 'Produto adicionado ao catálogo' },
      ],
    },
  ]);

  const handleDuplicate = (id: string) => {
    const o = offers.find((item) => item.id === id);
    if (o) {
      const dup = {
        ...o,
        id: `off_${Date.now()}`,
        title: `${o.title} (Cópia)`,
        status: 'ADICIONADO' as const,
        publicationCount: 0,
      };
      setOffers([dup, ...offers]);
    }
  };

  const handleSave = (id: string, updatedTitle: string, updatedCTA: string) => {
    setOffers(
      offers.map((item) =>
        item.id === id ? { ...item, title: updatedTitle, cta: updatedCTA } : item
      )
    );
    setEditingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOVO':
        return <Badge variant="info">Novo</Badge>;
      case 'ADICIONADO':
        return <Badge variant="neutral">Adicionado</Badge>;
      case 'PUBLICADO':
        return <Badge variant="success">Publicado</Badge>;
      case 'REPUBLICADO':
        return <Badge variant="warning">Republicado</Badge>;
      case 'ARQUIVADO':
      default:
        return <Badge variant="danger">Arquivado</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Edit3 className="h-6 w-6 text-blue-400" />
            <span>Central de Ofertas, Copys & Histórico de Publicações</span>
          </h1>
          <p className="text-sm text-slate-400">Editor profissional com identificação visual do marketplace e rastreamento de publicações.</p>
        </div>
      </div>

      <div className="space-y-6">
        {offers.map((o) => {
          const isEditing = editingId === o.id;
          const showWarning = warningId === o.id;

          return (
            <Card key={o.id} className="p-6 border-slate-800 bg-slate-900/90">
              <CardHeader className="p-0 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <MarketplaceBadge marketplaceSlug={o.marketplace} />
                      {getStatusBadge(o.status)}
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={o.title}
                        id={`title_${o.id}`}
                        className="w-full bg-slate-950 border border-blue-500 rounded-lg p-2 text-sm text-white font-bold"
                      />
                    ) : (
                      <CardTitle className="text-lg text-white">{o.title}</CardTitle>
                    )}
                    <span className="text-emerald-400 font-bold text-base block">{o.price}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <OfferScoreBadge score={o.score} label={o.scoreLabel} />
                    <Button size="sm" variant="outline" className="text-xs" leftIcon={<Layers className="h-3.5 w-3.5" />} onClick={() => handleDuplicate(o.id)}>
                      Duplicar
                    </Button>
                    {isEditing ? (
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-xs"
                        leftIcon={<Save className="h-3.5 w-3.5" />}
                        onClick={() => {
                          const titleEl = document.getElementById(`title_${o.id}`) as HTMLInputElement;
                          const ctaEl = document.getElementById(`cta_${o.id}`) as HTMLInputElement;
                          handleSave(o.id, titleEl?.value || o.title, ctaEl?.value || o.cta);
                        }}
                      >
                        Salvar
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" className="text-xs" leftIcon={<Edit3 className="h-3.5 w-3.5" />} onClick={() => setEditingId(o.id)}>
                        Editar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Republication Alert */}
                {o.publicationCount > 0 && (
                  <div className="mt-3 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-center justify-between text-xs text-amber-300">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                      <span>Este produto já foi publicado <strong>{o.publicationCount} vezes</strong> (Última: {o.lastPublishedAt}).</span>
                    </div>
                  </div>
                )}

                <div className="mt-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-400">
                  <span className="font-semibold text-blue-400">Diagnóstico da IA:</span> {o.justification}
                </div>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                {/* Advanced Editor Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-slate-950/80 p-4 border border-slate-800/80 text-xs">
                  <div>
                    <span className="font-semibold text-slate-300 block mb-1">CTA Principal:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={o.cta}
                        id={`cta_${o.id}`}
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
                      />
                    ) : (
                      <p className="text-slate-300">{o.cta}</p>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold text-slate-300 block mb-1">Hashtags:</span>
                    <span className="text-blue-400 font-mono">{o.hashtags}</span>
                  </div>
                </div>

                {/* Timeline History */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs space-y-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-blue-400">
                    <History className="h-3.5 w-3.5" />
                    <span>Linha do Tempo de Eventos e Publicações:</span>
                  </span>
                  <div className="space-y-1.5 pl-2 border-l-2 border-slate-800">
                    {o.history.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-[11px]">
                        <span className="text-slate-500 font-mono">{h.date}</span>
                        <span className="text-slate-300">{h.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Copy Box & Rating */}
                <ChannelCopyBox
                  whatsAppText={o.whatsAppText}
                  telegramText={o.telegramText}
                  instagramText={o.instagramText}
                  affiliateUrl={o.affiliateUrl}
                />

                <div className="pt-2 flex justify-end">
                  <OfferRatingWidget offerId={o.id} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
