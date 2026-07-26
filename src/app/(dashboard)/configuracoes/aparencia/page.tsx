'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Palette, Moon, Sun, Type, RefreshCw, CheckCircle2,
  Loader2, Save, X,
} from 'lucide-react';
import {
  useAppearance,
  defaultSettings,
  type FontOption,
  type ThemeOption,
  type AppearanceSettings,
} from '@/presentation/context/AppearanceContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const FONTS: FontOption[] = ['Inter', 'Roboto', 'Poppins', 'Arial'];

const COLOR_PRESETS = [
  { label: 'Azul',     value: '#2563EB' },
  { label: 'Índigo',   value: '#4F46E5' },
  { label: 'Roxo',     value: '#7C3AED' },
  { label: 'Verde',    value: '#10B981' },
  { label: 'Laranja',  value: '#F97316' },
  { label: 'Vermelho', value: '#EF4444' },
  { label: 'Rosa',     value: '#EC4899' },
  { label: 'Ciano',    value: '#06B6D4' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AparenciaPage() {
  const { settings, commitSettings, resetToDefault, isLoading } = useAppearance();

  // Local draft — changes here do NOT touch the global app until "Salvar"
  const [draft, setDraft] = useState<AppearanceSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync draft when saved settings load from Firebase
  useEffect(() => {
    setDraft(settings);
    setIsDirty(false);
  }, [settings]);

  const patch = useCallback((p: Partial<AppearanceSettings>) => {
    setDraft((prev) => ({ ...prev, ...p }));
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await commitSettings(draft);
      setIsDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(settings);
    setIsDirty(false);
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await resetToDefault();
      // settings will update via useEffect above
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-slate-400 text-xs gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        Carregando preferências...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Palette className="h-6 w-6 text-blue-400" />
          Aparência
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Escolha suas preferências e clique em <strong className="text-slate-300">Salvar alterações</strong> para aplicar em todo o sistema.
        </p>
      </div>

      {/* ── Success banner ─────────────────────────────────────────────── */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Preferências salvas e aplicadas com sucesso!
        </div>
      )}

      {/* ── Dirty-state notice ─────────────────────────────────────────── */}
      {isDirty && !success && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-300">
          <Palette className="h-4 w-4 shrink-0" />
          Você tem alterações não salvas. Clique em &ldquo;Salvar alterações&rdquo; para aplicar.
        </div>
      )}

      {/* ── Tema ───────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-200">Tema</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { id: 'dark',  label: 'Escuro', icon: Moon },
              { id: 'light', label: 'Claro',  icon: Sun  },
            ] as { id: ThemeOption; label: string; icon: React.ElementType }[]
          ).map((t) => {
            const Icon = t.icon;
            const active = draft.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => patch({ theme: t.id })}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-semibold transition
                  ${active
                    ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                {t.label}
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-blue-400" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Fonte ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-200">Fonte</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FONTS.map((font) => {
            const active = draft.fontFamily === font;
            return (
              <button
                key={font}
                type="button"
                onClick={() => patch({ fontFamily: font })}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-semibold transition
                  ${active
                    ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                style={{ fontFamily: font === 'Arial' ? 'Arial, sans-serif' : `'${font}', sans-serif` }}
              >
                <span>{font}</span>
                {active && <span className="h-2 w-2 rounded-full bg-blue-400" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Cor do sistema ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-full border border-white/20 shrink-0 transition-colors duration-200"
            style={{ backgroundColor: draft.primaryColor }}
          />
          <h2 className="text-sm font-bold text-slate-200">Cor do Sistema</h2>
        </div>

        {/* Preset swatches */}
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((preset) => {
            const active = draft.primaryColor === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                title={preset.label}
                onClick={() => patch({ primaryColor: preset.value })}
                className={`flex flex-col items-center gap-1 p-1 rounded-xl border transition
                  ${active ? 'border-white/60 scale-105' : 'border-transparent hover:border-white/20'}`}
              >
                <span
                  className="h-8 w-8 rounded-full shadow-md"
                  style={{ backgroundColor: preset.value }}
                />
                <span className="text-[10px] text-slate-400">{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom HEX picker */}
        <div className="flex items-center gap-3 pt-1">
          <label className="text-xs text-slate-400 font-medium whitespace-nowrap">Personalizada:</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
            <input
              type="color"
              value={draft.primaryColor}
              onChange={(e) => patch({ primaryColor: e.target.value })}
              className="h-7 w-7 rounded cursor-pointer bg-transparent border-none outline-none"
            />
            <span className="text-xs font-mono text-slate-300">{draft.primaryColor.toUpperCase()}</span>
          </div>
        </div>
      </section>

      {/* ── Action Buttons ─────────────────────────────────────────────── */}
      <section className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
        {/* Salvar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition
            ${isDirty && !saving
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>

        {/* Cancelar */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={!isDirty || saving}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-300 hover:text-white hover:border-slate-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4" />
          Cancelar
        </button>
      </section>

      {/* ── Restaurar Padrão ───────────────────────────────────────────── */}
      <section>
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-300 transition disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Restaurar configurações padrão
        </button>
      </section>

    </div>
  );
}
