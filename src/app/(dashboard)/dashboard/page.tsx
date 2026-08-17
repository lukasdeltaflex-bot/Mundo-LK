'use client';

import React, { useState, useEffect } from 'react';
import { OfferCreationFlow } from '@/presentation/components/business/OfferCreationFlow';
import { SaveReadyOfferFlow } from '@/presentation/components/business/SaveReadyOfferFlow';
import { useAuth } from '@/presentation/context/AuthContext';
import { ShoppingBag, Sparkles, Layers, Zap, Link as LinkIcon, Package, FileText, Loader2, PlusCircle, Bot } from 'lucide-react';
import { Card } from '@/presentation/components/ui/Card';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { Product } from '@/core/domain/entities/product.entity';
import Link from 'next/link';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const [loading, setLoading] = useState(true);
  const [creationMode, setCreationMode] = useState<'ai' | 'ready'>('ai');

  const loadProducts = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    const uid = user.uid;
    try {
      const prodRepo = new FirestoreProductRepository();
      const prods = await prodRepo.findAll(uid);
      setProducts(prods);
    } catch (err) {
      console.warn('[Dashboard] Erro ao carregar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user]);

  // ── Atalhos rápidos ──────────────────────────────────────────────────────
  const shortcuts = [
    { label: 'Importação em Lote', href: '/lote',        icon: Layers   },
    { label: 'Agendamento',        href: '/agendamento', icon: FileText },
    { label: 'Coleções',           href: '/colecoes',    icon: Package  },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6">
      {/* ── Boas-vindas ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Olá, {user?.name || 'Afiliado'}!
          <Sparkles className="h-5 w-5 text-blue-400 animate-pulse" />
        </h1>
        <p className="text-xs text-slate-300 mt-1">
          Central de trabalho — produtos e geração inteligente de anúncios com IA.
        </p>

        {/* Contadores reais inline no banner */}
        {!loading && (
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl px-3 py-2 border border-slate-800">
              <ShoppingBag className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">{products.length}</span>
              <span className="text-xs text-slate-400">produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Atalhos rápidos ────────────────────────────────────────────── */}
      <section>
        <SectionHeading icon={Zap} label="Atalhos Rápidos" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

      {/* ── Criar Nova Oferta (Seletor de Modo) ───────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeading icon={PlusCircle} label="Criar Nova Oferta" />
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setCreationMode('ai')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${creationMode === 'ai' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Bot className="h-3.5 w-3.5" /> 🤖 Criar com IA
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('ready')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${creationMode === 'ready' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <FileText className="h-3.5 w-3.5" /> 📋 Salvar Oferta Pronta
            </button>
          </div>
        </div>

        {creationMode === 'ai' ? (
          <OfferCreationFlow onSaved={loadProducts} />
        ) : (
          <SaveReadyOfferFlow onSaved={loadProducts} />
        )}
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
              <Card key={p.id} className="p-4 flex flex-col gap-2 border-slate-800 bg-slate-900/90">
                <p className="text-xs font-semibold text-white line-clamp-2">
                  {p.title || 'Produto sem título'}
                </p>
                {p.currentPrice && p.currentPrice.amount > 0 && (
                  <span className="text-sm font-bold text-emerald-400">
                    {p.currentPrice.formatBRL()}
                  </span>
                )}
                {p.originalUrl && (
                  <a
                    href={p.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition truncate"
                  >
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.originalUrl}</span>
                  </a>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
