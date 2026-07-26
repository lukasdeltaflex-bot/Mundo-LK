'use client';

import React, { useState, useCallback } from 'react';
import {
  Link as LinkIcon, Sparkles, Loader2, CheckCircle2,
  Edit3, RefreshCcw, X, Save, Copy, Check,
  Tag, Image as ImageIcon, ArrowRight,
  MessageCircle, Send, Brain, Target, Heart,
  TrendingUp, Zap, Crown, ShoppingCart, Minimize2, AlertCircle,
} from 'lucide-react';
import { analyzeProductUrlAction, type OfferPreview, type OfferStyle } from '@/presentation/actions/analyze-url.action';
import { saveApprovedOfferAction } from '@/presentation/actions/save-offer.action';
import { useAuth } from '@/presentation/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

// ─── Style options ────────────────────────────────────────────────────────────

interface StyleOption {
  id:       OfferStyle;
  label:    string;
  desc:     string;
  icon:     React.ElementType;
  color:    string;
  border:   string;
}

const STYLE_OPTIONS: StyleOption[] = [
  { id: 'padrao',    label: 'Padrão',      desc: 'Equilibrado e persuasivo',      icon: Sparkles,    color: 'text-blue-400',   border: 'border-blue-500/40'   },
  { id: 'elegante',  label: 'Elegante',    desc: 'Sofisticado e premium',         icon: Crown,       color: 'text-purple-400', border: 'border-purple-500/40' },
  { id: 'urgencia',  label: 'Urgência',    desc: 'Escassez e oportunidade única', icon: Zap,         color: 'text-amber-400',  border: 'border-amber-500/40'  },
  { id: 'promocao',  label: 'Promoção',    desc: 'Foco no preço e desconto',      icon: TrendingUp,  color: 'text-emerald-400',border: 'border-emerald-500/40'},
  { id: 'minimalista',label: 'Minimalista',desc: 'Conciso e direto',              icon: Minimize2,   color: 'text-slate-300',  border: 'border-slate-500/40'  },
  { id: 'emocional', label: 'Emocional',   desc: 'Apelo ao sonho e transformação',icon: Heart,       color: 'text-rose-400',   border: 'border-rose-500/40'   },
];

// ─── Flow steps ───────────────────────────────────────────────────────────────

type FlowStep = 'input' | 'analyzing' | 'preview' | 'editing' | 'saving' | 'done';

const ANALYSIS_STEPS = [
  { icon: '🌐', text: 'Acessando página do produto…' },
  { icon: '🔍', text: 'Extraindo nome, imagem e preço…' },
  { icon: '🧠', text: 'IA analisando público e benefícios…' },
  { icon: '✍️', text: 'Criando oferta personalizada…' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* */ }
      }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copiado!' : label}
    </button>
  );
}

function ScorePill({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : score >= 50 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              :               'bg-red-500/15 text-red-400 border-red-500/30';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${color}`}>
      {score}/100 · {label === 'EXCELLENT' ? 'Excelente' : label === 'GOOD' ? 'Boa oferta' : 'Regular'}
    </span>
  );
}

function AnalysisCard({ icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  const Icon = icon;
  return (
    <div className="flex gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
      <div className="mt-0.5 shrink-0">
        <Icon className="h-4 w-4 text-blue-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xs text-slate-200 leading-relaxed">{value || '—'}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface OfferCreationFlowProps {
  onSaved?: (productId: string, offerId: string) => void;
}

export function OfferCreationFlow({ onSaved }: OfferCreationFlowProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [step,    setStep]    = useState<FlowStep>('input');
  const [url,     setUrl]     = useState('');
  const [tag,     setTag]     = useState('');
  const [style,   setStyle]   = useState<OfferStyle>('padrao');
  const [error,   setError]   = useState<string | null>(null);
  const [preview, setPreview] = useState<OfferPreview | null>(null);

  // Editable overrides
  const [editTitle, setEditTitle] = useState('');
  const [editCta,   setEditCta]   = useState('');

  const [savedIds, setSavedIds] = useState<{ productId: string; offerId: string } | null>(null);

  // ── Analyze ───────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async (overrideStyle?: OfferStyle) => {
    const rawUrl = url.trim();
    console.log('[1] Botão clicado - URL:', rawUrl);

    if (!rawUrl) {
      console.warn('[Validação Frontend] URL vazia ou inválida.');
      setError('Cole a URL do produto para continuar.');
      return;
    }

    setError(null);
    setStep('analyzing');
    console.log('[2] Server Action iniciada - chamando analyzeProductUrlAction...');

    try {
      const result = await analyzeProductUrlAction({
        url:          rawUrl,
        affiliateTag: tag.trim() || 'mundolk',
        userId:       user?.uid,
        style:        overrideStyle ?? style,
      });

      console.log('[6] Retornando ao frontend - Resultado:', result.success ? 'SUCESSO' : 'FALHA');

      if (!result.success) {
        console.error('[ERRO SERVER ACTION]:', result.error);
        setError(result.error || 'Não conseguimos analisar esse link agora. Tente novamente.');
        setStep('input');
        return;
      }

      console.log('[7] Renderizando prévia da oferta na tela');
      setPreview(result.data);
      setEditTitle(result.data.product.title);
      setEditCta(result.data.offer.cta);
      setStyle(overrideStyle ?? style);
      setStep('preview');
      console.log('[8] Finalizado - Prévia renderizada com sucesso!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[EXCEÇÃO FRONTEND]:', msg);
      if (msg.includes('was not found on the server') || msg.includes('Server Action')) {
        setError('O sistema foi atualizado! Recarregando a página em instantes para aplicar a nova versão...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }
      setError('Não conseguimos analisar esse link agora. Verifique a URL e tente novamente.');
      setStep('input');
    }
  }, [url, tag, user, style]);

  // Regenerate with same or different style
  const handleRegenerate = useCallback((newStyle?: OfferStyle) => {
    if (newStyle) setStyle(newStyle);
    handleAnalyze(newStyle ?? style);
  }, [handleAnalyze, style]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    if (!preview || !user) return;
    setStep('saving');
    setError(null);

    try {
      const result = await saveApprovedOfferAction({
        preview,
        userId:      user.uid,
        editedTitle: editTitle !== preview.product.title ? editTitle : undefined,
        editedCta:   editCta   !== preview.offer.cta    ? editCta   : undefined,
      });

      if (!result.success) {
        setError(result.error || 'Falha ao salvar a oferta.');
        setStep('preview');
        return;
      }

      setSavedIds({ productId: result.productId, offerId: result.offerId });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      setStep('done');
      onSaved?.(result.productId, result.offerId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[OfferCreationFlow] Save error:', msg);
      setError(`Erro ao salvar a oferta: ${msg}`);
      setStep('preview');
    }
  }, [preview, user, editTitle, editCta, queryClient, onSaved]);

  const handleReset = () => {
    setStep('input');
    setUrl('');
    setTag('');
    setPreview(null);
    setError(null);
    setSavedIds(null);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  // ── Step: Input ──────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div className="rounded-2xl border border-blue-500/20 bg-slate-900/90 p-6 space-y-5 shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20">
            <Brain className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Criar Nova Oferta com IA Real</h3>
            <p className="text-xs text-slate-400 mt-0.5">A IA analisa o produto individualmente e cria uma oferta única — nunca genérica.</p>
          </div>
        </div>

        {/* URL */}
        <div className="space-y-3">
          <div className="relative">
            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://mercadolivre.com.br/... ou https://shopee.com.br/..."
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="relative">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag de afiliado (opcional)"
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Style selector */}
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            Estilo da oferta
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STYLE_OPTIONS.map((s) => {
              const Icon   = s.icon;
              const active = style === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition ${
                    active
                      ? `${s.border} bg-slate-800 ${s.color}`
                      : 'border-slate-800 bg-slate-950/50 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? s.color : 'text-slate-600'}`} />
                  <span className="text-[11px] font-semibold leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Friendly Error Box */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-white">Não foi possível analisar o produto</p>
              <p className="text-red-300/90 leading-relaxed">{error}</p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition text-[11px]"
                >
                  <RefreshCcw className="h-3 w-3" /> Tentar Novamente
                </button>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 font-semibold hover:bg-slate-800 transition text-[11px]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => handleAnalyze()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/20"
          >
            <Brain className="h-4 w-4" />
            Criar Nova Oferta
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Analyzing ──────────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <div className="rounded-2xl border border-blue-500/20 bg-slate-900/90 p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            <h3 className="text-sm font-bold text-white">IA analisando produto…</h3>
          </div>
          {/* Cancel button during loading so user is never trapped */}
          <button
            type="button"
            onClick={() => {
              setStep('input');
              setError(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>

        <div className="space-y-2.5">
          {ANALYSIS_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="text-base">{s.icon}</span>
              <span className="text-slate-400">{s.text}</span>
              <Loader2 className="h-3 w-3 animate-spin text-blue-400 ml-auto" style={{ animationDelay: `${i * 0.4}s` }} />
            </div>
          ))}
        </div>

        <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
          <span>Estilo selecionado: <strong className="text-blue-400">{STYLE_OPTIONS.find(s => s.id === style)?.label}</strong></span>
          <span className="text-slate-600 font-mono">Processando...</span>
        </div>
      </div>
    );
  }

  // ── Step: Done ───────────────────────────────────────────────────────────
  if (step === 'done' && savedIds) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-white">Oferta salva com sucesso!</h3>
            <p className="text-xs text-slate-400 mt-0.5">Produto e anúncio já aparecem no Dashboard e Minhas Ofertas.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Criar outra oferta
        </button>
      </div>
    );
  }

  // ── Step: Preview / Editing / Saving ─────────────────────────────────────
  if ((step === 'preview' || step === 'editing' || step === 'saving') && preview) {
    const p         = preview.product;
    const a         = preview.analysis;
    const o         = preview.offer;
    const isEditing = step === 'editing';
    const isSaving  = step === 'saving';

    const currentStyleOption = STYLE_OPTIONS.find(s => s.id === o.style)!;

    return (
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-400" />
            Análise da IA — Revisar antes de salvar
          </h3>
          <button type="button" onClick={handleReset} className="text-slate-500 hover:text-slate-300 transition p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-400">{error}</div>
        )}

        {/* ── Product Card ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/90 p-5 space-y-4">

          {/* Image + Title + Price */}
          <div className="flex gap-4">
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

            <div className="flex-1 space-y-1.5 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-blue-500 rounded-lg px-3 py-2 text-sm font-bold text-white"
                />
              ) : (
                <p className="text-sm font-bold text-white leading-snug line-clamp-2">{editTitle}</p>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-blue-600/15 border border-blue-500/20 text-[10px] font-semibold text-blue-300">{p.marketplaceSlug}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600 text-[10px] font-semibold text-slate-300">{p.categoryId}</span>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${currentStyleOption.border} ${currentStyleOption.color}`}>
                  {currentStyleOption.label}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-emerald-400">{p.price}</span>
                {p.previousPrice && p.discountPercent !== '0%' && (
                  <>
                    <span className="text-xs text-slate-500 line-through">{p.previousPrice}</span>
                    <span className="text-xs font-bold text-emerald-400">-{p.discountPercent}</span>
                  </>
                )}
              </div>

              <ScorePill score={o.score} label={o.scoreLabel} />
            </div>
          </div>

          {/* ── AI REASONING SECTION ─────────────────────────────────── */}
          <div className="rounded-xl border border-blue-500/15 bg-blue-950/20 p-4 space-y-2">
            <p className="text-xs font-bold text-blue-400 flex items-center gap-2 mb-3">
              <Brain className="h-3.5 w-3.5" />
              Raciocínio da IA sobre este produto
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <AnalysisCard icon={Target}       label="Público-alvo"         value={a.publicoAlvo} />
              <AnalysisCard icon={Heart}        label="Dor que resolve"      value={a.dorQueResolve} />
              <AnalysisCard icon={TrendingUp}   label="Benefício principal"   value={a.beneficioPrincipal} />
              <AnalysisCard icon={Sparkles}     label="Ângulo de venda"      value={a.anguloDeVenda} />
              <AnalysisCard icon={Brain}        label="Emoção de compra"     value={a.emocaoDeCompra} />
              <AnalysisCard icon={ShoppingCart} label="Argumento principal"   value={a.argumentoComercial} />
            </div>
          </div>

          {/* ── Score justification ───────────────────────────────────── */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Avaliação da Oferta</p>
            <p className="text-xs text-slate-300 leading-relaxed">{o.justification}</p>
          </div>

          {/* ── CTA ──────────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-1.5">Chamada para Ação:</p>
            {isEditing ? (
              <input
                type="text"
                value={editCta}
                onChange={(e) => setEditCta(e.target.value)}
                className="w-full bg-slate-950 border border-blue-500 rounded-lg px-3 py-2 text-xs text-white"
              />
            ) : (
              <p className="text-sm font-semibold text-white">{editCta}</p>
            )}
          </div>

          {/* ── Hashtags + Emojis ──────────────────────────────────────── */}
          <div className="flex flex-wrap gap-1.5">
            {o.emojis.map((e, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-sm">{e}</span>
            ))}
            {o.hashtags.map((h) => (
              <span key={h} className="px-2 py-0.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-[11px] text-blue-400 font-mono">{h}</span>
            ))}
          </div>

          {/* ── Copies ───────────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">Copys geradas pela IA:</p>
            {[
              { icon: '📱', label: 'WhatsApp',  text: o.whatsAppText,  ch: 'WhatsApp'  },
              { icon: '✈️', label: 'Telegram',  text: o.telegramText,  ch: 'Telegram'  },
              { icon: '📸', label: 'Instagram', text: o.instagramText, ch: 'Instagram' },
              { icon: '📢', label: 'Canal',     text: o.channelText,   ch: 'Canal'     },
            ].map(({ icon, label, text, ch }) => (
              <div key={ch} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400">{icon} {label}</span>
                  <CopyBtn text={text} label={`Copiar`} />
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4">{text || '—'}</p>
              </div>
            ))}
          </div>

          {/* ── Quick share ───────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(o.whatsAppText)}`, '_blank')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(p.affiliateUrl)}&text=${encodeURIComponent(o.telegramText)}`, '_blank')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition"
            >
              <Send className="h-3.5 w-3.5" />
              Telegram
            </button>
          </div>
        </div>

        {/* ── Style switcher ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <p className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <RefreshCcw className="h-3.5 w-3.5 text-blue-400" />
            🎯 Alterar estilo e gerar nova abordagem:
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {STYLE_OPTIONS.map((s) => {
              const Icon   = s.icon;
              const active = o.style === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleRegenerate(s.id)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition text-[10px] font-semibold ${
                    active
                      ? `${s.border} bg-slate-800 ${s.color}`
                      : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? s.color : 'text-slate-600'}`} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Action buttons ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2">
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

          {/* Edit toggle */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => setStep(isEditing ? 'preview' : 'editing')}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {isEditing ? 'Concluir edição' : '✏️ Editar'}
          </button>

          {/* Regenerate same style */}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleRegenerate()}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            🔄 Nova oferta
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
      </div>
    );
  }

  return null;
}
