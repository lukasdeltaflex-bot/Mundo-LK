'use client';

import React, { useState, useCallback } from 'react';
import {
  Link as LinkIcon, Sparkles, Loader2, CheckCircle2,
  Edit3, RefreshCcw, X, Save, Copy, Check,
  Tag, Image as ImageIcon, ArrowRight,
  MessageCircle, Send,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { analyzeProductUrlAction, type OfferPreview } from '@/presentation/actions/analyze-url.action';
import { saveApprovedOfferAction } from '@/presentation/actions/save-offer.action';
import { useAuth } from '@/presentation/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

// ─── Step Types ───────────────────────────────────────────────────────────────

type FlowStep = 'input' | 'analyzing' | 'preview' | 'editing' | 'saving' | 'done';

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copiado!' : label}
    </button>
  );
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScorePill({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
    score >= 50 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                  'bg-red-500/15 text-red-400 border-red-500/30';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${color}`}>
      {score}/100 · {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface OfferCreationFlowProps {
  /** Called after the offer is successfully saved */
  onSaved?: (productId: string, offerId: string) => void;
}

export function OfferCreationFlow({ onSaved }: OfferCreationFlowProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep]         = useState<FlowStep>('input');
  const [url, setUrl]           = useState('');
  const [tag, setTag]           = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [preview, setPreview]   = useState<OfferPreview | null>(null);

  // Editable fields
  const [editTitle, setEditTitle] = useState('');
  const [editCta,   setEditCta]   = useState('');

  const [savedIds, setSavedIds] = useState<{ productId: string; offerId: string } | null>(null);

  // ── Step 1→2: Analyze URL ─────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) { setError('Cole a URL do produto.'); return; }
    setError(null);
    setStep('analyzing');

    const result = await analyzeProductUrlAction({
      url: url.trim(),
      affiliateTag: tag.trim() || 'mundolk',
      userId: user?.uid,
    });

    if (!result.success) {
      setError(result.error);
      setStep('input');
      return;
    }

    setPreview(result.data);
    setEditTitle(result.data.product.title);
    setEditCta(result.data.offer.cta);
    setStep('preview');
  }, [url, tag, user]);

  // ── Step 3: Approve & Save ────────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!preview || !user) return;
    setStep('saving');
    setError(null);

    const result = await saveApprovedOfferAction({
      preview,
      userId: user.uid,
      editedTitle: editTitle !== preview.product.title ? editTitle : undefined,
      editedCta:   editCta   !== preview.offer.cta    ? editCta   : undefined,
    });

    if (!result.success) {
      setError(result.error);
      setStep('preview');
      return;
    }

    setSavedIds({ productId: result.productId, offerId: result.offerId });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['offers'] });
    setStep('done');
    onSaved?.(result.productId, result.offerId);
  }, [preview, user, editTitle, editCta, queryClient, onSaved]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStep('input');
    setUrl('');
    setTag('');
    setPreview(null);
    setError(null);
    setSavedIds(null);
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  // Step: Input
  if (step === 'input') {
    return (
      <Card className="p-6 border-blue-500/20 bg-slate-900/90">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Criar Nova Oferta com IA</h3>
            <p className="text-xs text-slate-400">Cole o link de afiliado — a IA analisa o produto e gera o anúncio completo para revisão.</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* URL */}
          <div className="relative">
            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://mercadolivre.com.br/produto... ou shopee.com.br/..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Affiliate tag (optional) */}
          <div className="relative">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag de afiliado (opcional — ex: mundolk)"
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 font-medium">{error}</p>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              className="text-xs font-bold px-6"
              onClick={handleAnalyze}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Analisar Produto
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Step: Analyzing
  if (step === 'analyzing') {
    const steps = [
      'Acessando página do produto…',
      'Extraindo nome, imagem e preço…',
      'Identificando categoria…',
      'Gerando anúncio com IA…',
    ];
    return (
      <Card className="p-6 border-blue-500/20 bg-slate-900/90">
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
          <h3 className="text-sm font-bold text-white">Analisando produto…</h3>
        </div>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin text-blue-400 shrink-0" style={{ animationDelay: `${i * 0.3}s` }} />
              {s}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // Step: Done
  if (step === 'done' && savedIds) {
    return (
      <Card className="p-6 border-emerald-500/30 bg-emerald-500/5">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <div>
            <h3 className="text-base font-bold text-white">Oferta salva com sucesso!</h3>
            <p className="text-xs text-slate-400 mt-0.5">Produto e anúncio foram salvos e já aparecem em Minhas Ofertas.</p>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-mono mb-4">
          Produto: {savedIds.productId} · Oferta: {savedIds.offerId}
        </div>
        <Button type="button" variant="secondary" className="text-xs" onClick={handleReset}>
          Criar outra oferta
        </Button>
      </Card>
    );
  }

  // Step: Preview / Editing
  if ((step === 'preview' || step === 'editing' || step === 'saving') && preview) {
    const p = preview.product;
    const o = preview.offer;
    const isEditing = step === 'editing';
    const isSaving  = step === 'saving';

    return (
      <div className="space-y-4">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            Prévia da Oferta — Revisar antes de salvar
          </h3>
          <button type="button" onClick={handleReset} className="text-slate-500 hover:text-slate-300 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-400">
            {error}
          </div>
        )}

        <Card className="p-5 border-blue-500/20 bg-slate-900/90">

          {/* ── Product image + title ─────────────────────────────── */}
          <div className="flex gap-4 mb-5">
            {p.imageUrl ? (
              <img
                src={p.imageUrl}
                alt={p.title}
                className="h-24 w-24 rounded-xl object-cover border border-slate-700 shrink-0 bg-slate-800"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-24 w-24 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                <ImageIcon className="h-8 w-8 text-slate-600" />
              </div>
            )}

            <div className="flex-1 space-y-2">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-blue-500 rounded-lg px-3 py-2 text-sm font-bold text-white"
                />
              ) : (
                <p className="text-sm font-bold text-white leading-snug">{editTitle}</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{p.marketplaceSlug}</Badge>
                <Badge variant="neutral">{p.categoryId}</Badge>
                <ScorePill score={o.score} label={o.scoreLabel} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-emerald-400">{p.price}</span>
                {p.discountPercent && p.discountPercent !== '0%' && (
                  <span className="text-xs text-slate-400 line-through">{p.previousPrice}</span>
                )}
                {p.discountPercent && p.discountPercent !== '0%' && (
                  <span className="text-xs font-bold text-emerald-400">-{p.discountPercent}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Category + Brand ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Categoria</span>
              <span className="font-semibold text-slate-200">{p.categoryId}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Marca</span>
              <span className="font-semibold text-slate-200">{p.brand || '—'}</span>
            </div>
          </div>

          {/* ── AI Diagnosis ─────────────────────────────────────────── */}
          <div className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-semibold text-blue-400 block mb-1">Diagnóstico IA:</span>
            <p className="text-xs text-slate-300 leading-relaxed">{o.justification}</p>
          </div>

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <div className="mb-4">
            <span className="text-xs font-semibold text-slate-300 block mb-1.5">Chamada para Ação (CTA):</span>
            {isEditing ? (
              <input
                type="text"
                value={editCta}
                onChange={(e) => setEditCta(e.target.value)}
                className="w-full bg-slate-950 border border-blue-500 rounded-lg px-3 py-2 text-xs text-white"
              />
            ) : (
              <p className="text-xs text-slate-200 font-medium">{editCta}</p>
            )}
          </div>

          {/* ── Hashtags + Emojis ─────────────────────────────────────── */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {o.hashtags.map((h) => (
              <span key={h} className="px-2 py-0.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-[11px] text-blue-400 font-mono">{h}</span>
            ))}
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">{o.emojis.join(' ')}</span>
          </div>

          {/* ── Copies preview ───────────────────────────────────────── */}
          <div className="space-y-3 mb-5">
            <span className="text-xs font-semibold text-slate-300">Textos gerados pela IA:</span>

            {[
              { label: '📱 WhatsApp',  text: o.whatsAppText,  channel: 'WhatsApp'  },
              { label: '✈️ Telegram',  text: o.telegramText,  channel: 'Telegram'  },
              { label: '📸 Instagram', text: o.instagramText, channel: 'Instagram' },
            ].map(({ label, text, channel }) => (
              <div key={channel} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400">{label}</span>
                  <CopyBtn text={text} label={`Copiar ${channel}`} />
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4">{text || '—'}</p>
              </div>
            ))}
          </div>

          {/* ── Share buttons ───────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 mb-5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(o.whatsAppText)}`, '_blank')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Enviar WhatsApp
            </button>
            <button
              type="button"
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(p.affiliateUrl)}&text=${encodeURIComponent(o.telegramText)}`, '_blank')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar Telegram
            </button>
          </div>

          {/* ── Action buttons ───────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-800">
            {/* Approve & Save */}
            <button
              type="button"
              onClick={handleApprove}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-lg shadow-emerald-500/20"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Salvando…' : '✅ Aprovar e Salvar'}
            </button>

            {/* Edit */}
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setStep(isEditing ? 'preview' : 'editing')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {isEditing ? 'Concluir Edição' : '✏️ Editar Oferta'}
            </button>

            {/* Regenerate */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleAnalyze}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              🔄 Nova Descrição
            </button>

            {/* Cancel */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-xs font-semibold transition"
            >
              <X className="h-3.5 w-3.5" />
              ❌ Cancelar
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
