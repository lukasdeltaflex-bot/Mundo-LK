'use client';

import React, { useState, useEffect } from 'react';
import { OfferCreationFlow } from '@/presentation/components/business/OfferCreationFlow';
import { useAuth } from '@/presentation/context/AuthContext';
import { ShoppingBag, Sparkles, Edit3, Save, Layers,
  AlertTriangle, History, Zap, Link as LinkIcon,
  Package, FileText, Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { OfferScoreBadge } from '@/presentation/components/business/OfferScoreBadge';
import { ChannelCopyBox } from '@/presentation/components/business/ChannelCopyBox';
import { OfferRatingWidget } from '@/presentation/components/business/OfferRatingWidget';
import { MarketplaceBadge } from '@/presentation/components/business/MarketplaceBadge';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { Offer } from '@/core/domain/entities/offer.entity';
import { Product } from '@/core/domain/entities/product.entity';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

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
    case 'NOVO':        return <Badge variant="info">Novo</Badge>;
    case 'ADICIONADO':  return <Badge variant="neutral">Adicionado</Badge>;
    case 'PUBLICADO':   return <Badge variant="success">Publicado</Badge>;
    case 'REPUBLICADO': return <Badge variant="warning">Republicado</Badge>;
    default:            return <Badge variant="danger">Arquivado</Badge>;
  }
}

function SectionHeading({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-blue-400" />
      <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{label}</h2>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400">
          {count}
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [offers,   setOffers]   = useState<UIProductOffer[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Load real data once ──────────────────────────────────────────────────
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

        setProducts(prods);

        const formatted: UIProductOffer[] = offerList.map((o: Offer) => ({
          id:              o.id,
          title:           'Oferta de Produto',
          marketplace:     'Marketplace',
          price:           'R$ —',
          status:          'ADICIONADO',
          publicationCount: 0,
          lastPublishedAt: 'Nunca',
          score:           o.scoreValue   || 0,
          scoreLabel:      o.scoreLabel   || '—',
          justification:   o.scoreJustification || 'Oferta gerada com inteligência artificial.',
          cta:             o.cta          || '',
          hashtags:        o.hashtags ? o.hashtags.join(' ') : '',
          whatsAppText:    o.copies?.copies?.whatsAppText  || '',
          telegramText:    o.copies?.copies?.telegramText  || '',
          instagramText:   o.copies?.copies?.instagramText || '',
          affiliateUrl:    '',
          history: [{ date: new Date().toLocaleDateString('pt-BR'), text: 'Oferta gerada' }],
        }));

        setOffers(formatted);
      } catch (err) {
        console.warn('[Dashboard] Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, [user]);

  // ── Offer actions ────────────────────────────────────────────────────────
  const handleDuplicate = (id: string) => {
    const o = offers.find((item) => item.id === id);
    if (!o) return;
    setOffers([
      { ...o, id: `dup_${Date.now()}`, title: `${o.title} (Cópia)`, status: 'ADICIONADO', publicationCount: 0 },
      ...offers,
    ]);
  };

  const handleSave = (id: string, updatedTitle: string, updatedCTA: string) => {
    setOffers(offers.map((item) =>
      item.id === id ? { ...item, title: updatedTitle, cta: updatedCTA } : item
    ));
    setEditingId(null);
  };

  // ── Atalhos rápidos ──────────────────────────────────────────────────────
  const shortcuts = [
    { label: 'Importação em Lote', href: '/lote',        icon: Layers    },
    { label: 'Agendamento',        href: '/agendamento', icon: FileText  },
    { label: 'Meus Links',         href: '/links',       icon: LinkIcon  },
    { label: 'Coleções',           href: '/colecoes',    icon: Package   },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto">

      {/* ── Boas-vindas ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Olá, {user?.name || 'Afiliado'}!
          <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Central de trabalho — produtos, ofertas e geração de anúncios com IA.
        </p>

        {/* Contadores reais inline no banner */}
        {!loading && (
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl px-3 py-2 border border-slate-800">
              <ShoppingBag className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">{products.length}</span>
              <span className="text-xs text-slate-400">produto{products.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl px-3 py-2 border border-slate-800">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">{offers.length}</span>
              <span className="text-xs text-slate-400">oferta{offers.length !== 1 ? 's' : ''} gerada{offers.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Atalhos rápidos ────────────────────────────────────────────── */}
      <section>
        <SectionHeading icon={Zap} label="Atalhos Rápidos" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {shortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <Link key={s.href} href={s.href}>
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 hover:border-slate-700 transition cursor-pointer">
                  <Icon className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-300">{s.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Assistente IA — Gerar oferta por URL ───────────────────────── */}
      <section>
        <SectionHeading icon={Sparkles} label="Assistente IA — Criar Nova Oferta" />
        <OfferCreationFlow
          onSaved={() => {
            // Refresh data after saving
            setLoading(true);
            const uid = user?.uid || 'guest';
            Promise.all([
              new (require('@/infrastructure/firebase/repositories/firestore-product.repository').FirestoreProductRepository)().findAll(uid),
              new (require('@/infrastructure/firebase/repositories/firestore-offer.repository').FirestoreOfferRepository)().findByUserId(uid),
            ]).then(([prods, offerList]) => {
              setProducts(prods as Product[]);
              setOffers((offerList as Offer[]).map((o: Offer) => ({
                id: o.id, title: 'Oferta de Produto', marketplace: 'Marketplace', price: 'R$ —',
                status: 'ADICIONADO' as const, publicationCount: 0, lastPublishedAt: 'Nunca',
                score: o.scoreValue || 0, scoreLabel: o.scoreLabel || '—',
                justification: o.scoreJustification || '', cta: o.cta || '', hashtags: '',
                whatsAppText: o.copies?.copies?.whatsAppText || '',
                telegramText: o.copies?.copies?.telegramText || '',
                instagramText: o.copies?.copies?.instagramText || '',
                affiliateUrl: '', history: [{ date: new Date().toLocaleDateString('pt-BR'), text: 'Oferta salva' }],
              })));
            }).catch(console.warn).finally(() => setLoading(false));
          }}
        />
      </section>


      {/* ── Meus Produtos ──────────────────────────────────────────────── */}
      <section>
        <SectionHeading icon={ShoppingBag} label="Meus Produtos" count={products.length} />

        {loading ? (
          <div className="flex items-center gap-2 py-10 text-slate-500 text-xs justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando produtos…
          </div>
        ) : products.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-slate-800 bg-slate-900/40">
            <ShoppingBag className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white mb-1">Nenhum produto cadastrado ainda.</p>
            <p className="text-xs text-slate-400">Cole a URL de um produto no Assistente IA acima para começar.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <Card key={p.id} className="p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-white line-clamp-2">
                  {p.title || 'Produto sem título'}
                </p>
                {p.currentPrice && p.currentPrice.amount > 0 && (
                  <span className="text-sm font-bold text-emerald-400">
                    {p.currentPrice.formatBRL()}
                  </span>
                )}
                {p.originalUrl && (
                  <a href={p.originalUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition truncate">
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.originalUrl}</span>
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── Minhas Ofertas (conteúdos gerados) ────────────────────────── */}
      <section>
        <SectionHeading icon={Edit3} label="Conteúdos Gerados — Minhas Ofertas" count={offers.length} />

        {loading ? (
          <div className="flex items-center gap-2 py-10 text-slate-500 text-xs justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando ofertas…
          </div>
        ) : offers.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-slate-800 bg-slate-900/40">
            <Sparkles className="h-10 w-10 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white mb-1">Nenhuma oferta gerada ainda.</p>
            <p className="text-xs text-slate-400">Cole uma URL no Assistente IA para gerar seu primeiro anúncio.</p>
          </Card>
        ) : (
          <div className="space-y-5">
            {offers.map((o) => {
              const isEditing = editingId === o.id;
              return (
                <Card key={o.id} className="p-5 border-slate-800 bg-slate-900/90">
                  <CardHeader className="p-0 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Left: title + badges */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <MarketplaceBadge marketplaceSlug={o.marketplace} />
                          {getStatusBadge(o.status)}
                          {o.score > 0 && <OfferScoreBadge score={o.score} label={o.scoreLabel} />}
                        </div>

                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={o.title}
                            id={`title_${o.id}`}
                            className="w-full bg-slate-950 border border-blue-500 rounded-lg p-2 text-sm text-white font-bold"
                          />
                        ) : (
                          <p className="text-sm font-bold text-white">{o.title}</p>
                        )}

                        {o.price !== 'R$ —' && (
                          <span className="text-sm font-bold text-emerald-400">{o.price}</span>
                        )}
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm" variant="outline" className="text-xs"
                          leftIcon={<Layers className="h-3.5 w-3.5" />}
                          onClick={() => handleDuplicate(o.id)}
                        >
                          Duplicar
                        </Button>

                        {isEditing ? (
                          <Button
                            size="sm" variant="primary" className="text-xs"
                            leftIcon={<Save className="h-3.5 w-3.5" />}
                            onClick={() => {
                              const titleEl = document.getElementById(`title_${o.id}`) as HTMLInputElement;
                              const ctaEl   = document.getElementById(`cta_${o.id}`)   as HTMLInputElement;
                              handleSave(o.id, titleEl?.value || o.title, ctaEl?.value || o.cta);
                            }}
                          >
                            Salvar
                          </Button>
                        ) : (
                          <Button
                            size="sm" variant="secondary" className="text-xs"
                            leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                            onClick={() => setEditingId(o.id)}
                          >
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>

                    {o.publicationCount > 0 && (
                      <div className="mt-2 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg flex items-center gap-2 text-xs text-amber-300">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                        Publicado <strong>{o.publicationCount}x</strong> · Última: {o.lastPublishedAt}
                      </div>
                    )}

                    {o.justification && (
                      <div className="mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-400">
                        <span className="font-semibold text-blue-400">Diagnóstico IA: </span>
                        {o.justification}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-0 space-y-3">
                    {/* CTA + Hashtags */}
                    {(o.cta || o.hashtags) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl bg-slate-950/80 p-3 border border-slate-800/80 text-xs">
                        {o.cta && (
                          <div>
                            <span className="font-semibold text-slate-300 block mb-1">CTA:</span>
                            {isEditing ? (
                              <input type="text" defaultValue={o.cta} id={`cta_${o.id}`} className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200" />
                            ) : (
                              <p className="text-slate-300">{o.cta}</p>
                            )}
                          </div>
                        )}
                        {o.hashtags && (
                          <div>
                            <span className="font-semibold text-slate-300 block mb-1">Hashtags:</span>
                            <span className="text-blue-400 font-mono break-all">{o.hashtags}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* History */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs">
                      <span className="font-semibold text-blue-400 flex items-center gap-1.5 mb-2">
                        <History className="h-3.5 w-3.5" /> Histórico
                      </span>
                      <div className="space-y-1 pl-2 border-l border-slate-700">
                        {o.history.map((h, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-[11px]">
                            <span className="text-slate-500 font-mono">{h.date}</span>
                            <span className="text-slate-300">{h.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Copy boxes — only render if there's actual content */}
                    {(o.whatsAppText || o.telegramText || o.instagramText) && (
                      <ChannelCopyBox
                        whatsAppText={o.whatsAppText}
                        telegramText={o.telegramText}
                        instagramText={o.instagramText}
                        affiliateUrl={o.affiliateUrl}
                      />
                    )}

                    <div className="flex justify-end pt-1">
                      <OfferRatingWidget offerId={o.id} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
