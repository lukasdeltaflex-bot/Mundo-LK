'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { OfferScoreBadge } from '@/presentation/components/business/OfferScoreBadge';
import { ChannelCopyBox } from '@/presentation/components/business/ChannelCopyBox';
import { OfferRatingWidget } from '@/presentation/components/business/OfferRatingWidget';
import { MarketplaceBadge } from '@/presentation/components/business/MarketplaceBadge';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Edit3, Save, Layers, AlertTriangle, History, Sparkles, Plus } from 'lucide-react';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { useAuth } from '@/presentation/context/AuthContext';
import { Offer } from '@/core/domain/entities/offer.entity';

export interface UIProductOffer {
  id: string;
  title: string;
  marketplace: string;
  price: string;
  status: 'NOVO' | 'ADICIONADO' | 'PUBLICADO' | 'REPUBLICADO' | 'ARQUIVADO';
  publicationCount: number;
  lastPublishedAt: string;
  score: number;
  scoreLabel: string;
  justification: string;
  cta: string;
  benefits: string;
  hashtags: string;
  whatsAppText: string;
  telegramText: string;
  instagramText: string;
  affiliateUrl: string;
  history: Array<{ date: string; text: string }>;
}

export default function OfertasPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<UIProductOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOffers() {
      try {
        const repo = new FirestoreOfferRepository();
        const uid = user?.uid || 'guest';
        const list = await repo.findByUserId(uid);

        const formatted: UIProductOffer[] = list.map((o: Offer) => ({
          id: o.id,
          title: 'Oferta de Produto',
          marketplace: 'Marketplace',
          price: 'R$ 0,00',
          status: 'ADICIONADO',
          publicationCount: 0,
          lastPublishedAt: 'Nunca',
          score: o.scoreValue || 90,
          scoreLabel: o.scoreLabel || 'EXCELLENT',
          justification: o.scoreJustification || 'Oferta gerada com inteligência artificial.',
          cta: o.cta || '👉 Clique aqui para comprar!',
          benefits: '',
          hashtags: o.hashtags ? o.hashtags.join(' ') : '#mundolk',
          whatsAppText: o.copies?.copies?.whatsAppText || '',
          telegramText: o.copies?.copies?.telegramText || '',
          instagramText: o.copies?.copies?.instagramText || '',
          affiliateUrl: '',
          history: [{ date: new Date().toLocaleDateString('pt-BR'), text: 'Oferta gerada' }],
        }));

        setOffers(formatted);
      } catch (err) {
        console.warn('Erro ao carregar ofertas:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, [user]);

  const handleDuplicate = (id: string) => {
    const o = offers.find((item) => item.id === id);
    if (o) {
      const dup: UIProductOffer = {
        ...o,
        id: `off_${Date.now()}`,
        title: `${o.title} (Cópia)`,
        status: 'ADICIONADO',
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
            <span>Central de Ofertas & Copys</span>
          </h1>
          <p className="text-sm text-slate-400">Gerencie, edite e exporte ofertas geradas por IA para múltiplos canais.</p>
        </div>

        <Link href="/dashboard">
          <Button size="sm" variant="primary" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Gerar Nova Oferta por URL
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">Carregando suas ofertas reais...</div>
      ) : offers.length === 0 ? (
        /* Empty State with 0 Mock Data */
        <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/40">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Nenhuma oferta criada ainda.</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Cole a URL de um produto no Dashboard para importar os dados e gerar suas ofertas com Inteligência Artificial.
          </p>
          <Link href="/dashboard">
            <Button variant="primary" size="sm" className="text-xs" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Importar Produto & Criar 1ª Oferta
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {offers.map((o) => {
            const isEditing = editingId === o.id;

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

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs space-y-2">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-blue-400">
                      <History className="h-3.5 w-3.5" />
                      <span>Linha do Tempo de Eventos:</span>
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
      )}
    </div>
  );
}
