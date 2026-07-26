'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FastImportBox } from '@/presentation/components/business/FastImportBox';
import { OfferScoreBadge } from '@/presentation/components/business/OfferScoreBadge';
import { ChannelCopyBox } from '@/presentation/components/business/ChannelCopyBox';
import { OfferRatingWidget } from '@/presentation/components/business/OfferRatingWidget';
import { MarketplaceBadge } from '@/presentation/components/business/MarketplaceBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { useImportWorkflow } from '@/presentation/hooks/useImportWorkflow';
import { useAuth } from '@/presentation/context/AuthContext';
import {
  ShoppingBag, Zap, Clock, Sparkles, Activity,
  Edit3, Save, Layers, AlertTriangle, History,
  TrendingUp, BrainCircuit, Plus,
} from 'lucide-react';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { Offer } from '@/core/domain/entities/offer.entity';

// ─── Types (migrated from /ofertas) ──────────────────────────────────────────

interface UIProductOffer {
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
  hashtags: string;
  whatsAppText: string;
  telegramText: string;
  instagramText: string;
  affiliateUrl: string;
  history: Array<{ date: string; text: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case 'NOVO':       return <Badge variant="info">Novo</Badge>;
    case 'ADICIONADO': return <Badge variant="neutral">Adicionado</Badge>;
    case 'PUBLICADO':  return <Badge variant="success">Publicado</Badge>;
    case 'REPUBLICADO':return <Badge variant="warning">Republicado</Badge>;
    default:           return <Badge variant="danger">Arquivado</Badge>;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { importOffer, isLoading: importLoading, data: importData } = useImportWorkflow();

  // ── Metrics ──
  const [productCount, setProductCount]   = useState(0);
  const [offerCount,   setOfferCount]     = useState(0);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // ── Offers (migrated from /ofertas) ──
  const [offers,     setOffers]     = useState<UIProductOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [editingId,  setEditingId]  = useState<string | null>(null);

  // ── Load everything once ──
  useEffect(() => {
    async function loadAll() {
      const uid = user?.uid || 'guest';
      try {
        const prodRepo  = new FirestoreProductRepository();
        const offerRepo = new FirestoreOfferRepository();

        const [prods, offerList] = await Promise.all([
          prodRepo.findAll(uid),
          offerRepo.findByUserId(uid),
        ]);

        setProductCount(prods.length);
        setOfferCount(offerList.length);
        setLoadingMetrics(false);

        const formatted: UIProductOffer[] = offerList.map((o: Offer) => ({
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
          hashtags: o.hashtags ? o.hashtags.join(' ') : '#mundolk',
          whatsAppText: o.copies?.copies?.whatsAppText || '',
          telegramText: o.copies?.copies?.telegramText || '',
          instagramText: o.copies?.copies?.instagramText || '',
          affiliateUrl: '',
          history: [{ date: new Date().toLocaleDateString('pt-BR'), text: 'Oferta gerada' }],
        }));

        setOffers(formatted);
      } catch (err) {
        console.warn('[Dashboard] Erro ao carregar dados:', err);
        setLoadingMetrics(false);
      } finally {
        setLoadingOffers(false);
      }
    }
    loadAll();
  }, [user]);

  // ── Offer actions ──
  const handleDuplicate = (id: string) => {
    const o = offers.find((item) => item.id === id);
    if (!o) return;
    setOffers([{ ...o, id: `off_${Date.now()}`, title: `${o.title} (Cópia)`, status: 'ADICIONADO', publicationCount: 0 }, ...offers]);
  };

  const handleSave = (id: string, updatedTitle: string, updatedCTA: string) => {
    setOffers(offers.map((item) => item.id === id ? { ...item, title: updatedTitle, cta: updatedCTA } : item));
    setEditingId(null);
  };

  // ── Summary metrics ──
  const metrics = [
    { name: 'Produtos no Catálogo',  value: loadingMetrics ? '…' : String(productCount), sub: productCount > 0 ? 'Catálogo Ativo' : '0 cadastrados', icon: ShoppingBag },
    { name: 'Ofertas Geradas',        value: loadingMetrics ? '…' : String(offerCount),   sub: '100% IA',          icon: Sparkles    },
    { name: 'Score Médio de Oferta',  value: offerCount > 0 ? '92/100' : '—',             sub: 'Excelente',        icon: Zap         },
    { name: 'Economia de Tempo',      value: offerCount > 0 ? `${(offerCount * 0.3).toFixed(1)}h` : '0h', sub: 'Tempo economizado', icon: Clock },
  ];

  // ── Intelligence tips (static, could be dynamic later) ──
  const tips = [
    { icon: TrendingUp,   color: 'text-emerald-400 bg-emerald-500/10', title: 'Produtos com alto score', desc: 'Seus produtos acima de 90/100 têm 3x mais conversão. Priorize-os.' },
    { icon: BrainCircuit, color: 'text-blue-400 bg-blue-500/10',       title: 'Otimize suas hashtags',  desc: 'Use de 5 a 10 hashtags específicas por nicho para maior alcance orgânico.' },
    { icon: Activity,     color: 'text-purple-400 bg-purple-500/10',   title: 'Melhore o CTA',          desc: 'CTAs com emojis e urgência aumentam o CTR em até 40% no WhatsApp.' },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto">

      {/* ═══════════════════════════════════════════════════════════════
          WELCOME BANNER
      ═══════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Olá, {user?.name || 'Afiliado'}! Bem-vindo ao Mundo LK.
          <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Seu Centro Inteligente de Gestão de Ofertas e Automação para Afiliados de Marketplaces.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SEÇÃO 1 — RESUMO GERAL
      ═══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Resumo Geral</h2>
        </div>

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
                  <span className="text-[11px] font-medium text-emerald-400">{m.sub}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SEÇÃO 2 — GERAR NOVA OFERTA
      ═══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Gerar Nova Oferta por URL</h2>
        </div>

        <FastImportBox
          isLoading={importLoading}
          onImport={async (formData) => {
            await importOffer({ url: formData.url, affiliateTag: formData.affiliateTag });
          }}
        />

        {/* Result after import */}
        {importData && (
          <Card className="mt-4 border-blue-500/40 bg-blue-950/20 animate-in fade-in duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-300">Nova Oferta Gerada com Sucesso!</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">{importData.title}</p>
                </div>
                <OfferScoreBadge score={importData.score} label={importData.scoreLabel} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xl font-bold text-emerald-400">{importData.price}</div>
              <ChannelCopyBox
                whatsAppText={importData.whatsappText}
                telegramText={importData.telegramText}
                instagramText={importData.instagramText}
                affiliateUrl={importData.whatsappText}
              />
            </CardContent>
          </Card>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SEÇÃO 3 — MINHAS OFERTAS (migrado de /ofertas)
      ═══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Minhas Ofertas</h2>
            {!loadingOffers && offers.length > 0 && (
              <span className="rounded-full bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                {offers.length}
              </span>
            )}
          </div>
        </div>

        {loadingOffers ? (
          <div className="text-center py-12 text-slate-500 text-xs">Carregando suas ofertas reais…</div>
        ) : offers.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-800 bg-slate-900/40">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto mb-4">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Nenhuma oferta criada ainda.</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Cole a URL de um produto acima para importar e gerar sua primeira oferta com IA.
            </p>
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
                            size="sm" variant="primary" className="text-xs"
                            leftIcon={<Save className="h-3.5 w-3.5" />}
                            onClick={() => {
                              const titleEl = document.getElementById(`title_${o.id}`) as HTMLInputElement;
                              const ctaEl   = document.getElementById(`cta_${o.id}`) as HTMLInputElement;
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
                      <div className="mt-3 bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-center gap-2 text-xs text-amber-300">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                        <span>Publicado <strong>{o.publicationCount}x</strong> (Última: {o.lastPublishedAt}).</span>
                      </div>
                    )}

                    <div className="mt-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-400">
                      <span className="font-semibold text-blue-400">Diagnóstico IA:</span> {o.justification}
                    </div>
                  </CardHeader>

                  <CardContent className="p-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-slate-950/80 p-4 border border-slate-800/80 text-xs">
                      <div>
                        <span className="font-semibold text-slate-300 block mb-1">CTA Principal:</span>
                        {isEditing ? (
                          <input type="text" defaultValue={o.cta} id={`cta_${o.id}`} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200" />
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
                      <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5" />
                        Linha do Tempo:
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
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SEÇÃO 4 — INTELIGÊNCIA & SUGESTÕES
      ═══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Inteligência & Sugestões</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <Card key={tip.title} className="p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${tip.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{tip.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{tip.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

    </div>
  );
}
