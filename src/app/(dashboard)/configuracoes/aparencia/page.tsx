'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Palette, Moon, Sun, Monitor, Type, Save, CheckCircle2, Loader2, RefreshCw, Layout, Eye, Sparkles, Check } from 'lucide-react';
import { useAppearance, defaultPreferences, AppearancePreferences } from '@/presentation/context/AppearanceContext';

export default function AparenciaPage() {
  const { settings, updateSettings, resetToDefault, isLoading } = useAppearance();

  // Local draft state for live preview before saving
  const [draft, setDraft] = useState<AppearancePreferences>(settings);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tema' | 'tipo' | 'cores' | 'layout' | 'previa'>('tema');

  useEffect(() => {
    if (!isLoading) {
      setDraft(settings);
    }
  }, [settings, isLoading]);

  const presetPalettes = [
    { name: 'Azul Profissional', primary: '#2563EB', secondary: '#1E40AF', accent: '#10B981' },
    { name: 'Verde Moderno', primary: '#10B981', secondary: '#047857', accent: '#3B82F6' },
    { name: 'Roxo Premium', primary: '#7C3AED', secondary: '#5B21B6', accent: '#F59E0B' },
    { name: 'Laranja Energia', primary: '#F97316', secondary: '#C2410C', accent: '#10B981' },
    { name: 'Vermelho Impacto', primary: '#EF4444', secondary: '#B91C1C', accent: '#3B82F6' },
    { name: 'Cinza Minimalista', primary: '#4B5563', secondary: '#1F2937', accent: '#6B7280' },
    { name: 'Preto Elegante', primary: '#111827', secondary: '#000000', accent: '#2563EB' },
  ];

  const handleUpdateDraft = (key: keyof AppearancePreferences, value: unknown) => {
    const updated = { ...draft, [key]: value };
    setDraft(updated);
    // Apply live to DOM
    updateSettings(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      await updateSettings(draft);
      setSuccessMsg('Todas as personalizações foram salvas no Firebase Firestore com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      setSuccessMsg('Erro ao salvar no Firebase.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Deseja restaurar todas as configurações para o padrão original?')) {
      await resetToDefault();
      setDraft(defaultPreferences);
      setSuccessMsg('Configurações restauradas para o padrão original.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-xs">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
        Carregando Central de Aparência...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Palette className="h-6 w-6 text-blue-400" />
            <span>Central Profissional de Aparência</span>
          </h1>
          <p className="text-sm text-slate-400">Personalize o tema, tipografia, cores, layout e visualize em tempo real.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={handleReset}>
            Restaurar Padrão
          </Button>
          <Button size="sm" variant="primary" className="text-xs" disabled={saving} leftIcon={saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} onClick={handleSave}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'tema', label: 'A) Tema', icon: Moon },
          { id: 'tipo', label: 'B) Tipografia', icon: Type },
          { id: 'cores', label: 'C) Cores & Paletas', icon: Palette },
          { id: 'layout', label: 'D) Layout & Estilo', icon: Layout },
          { id: 'previa', label: 'E) Prévia em Tempo Real', icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'tema' | 'tipo' | 'cores' | 'layout' | 'previa')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION A: TEMA */}
        {activeTab === 'tema' && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Modo de Tema</CardTitle>
              <CardDescription className="text-xs">Escolha a aparência geral do sistema Mundo LK</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'dark', label: 'Escuro (Dark Mode)', icon: Moon, desc: 'Fundo escuro profundo recomendado para menor fadiga visual' },
                  { id: 'light', label: 'Claro (Light Mode)', icon: Sun, desc: 'Interface de fundo claro com alto contraste e legibilidade' },
                  { id: 'auto', label: 'Automático (Sistema)', icon: Monitor, desc: 'Sincroniza com as preferências do seu sistema operacional' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = draft.theme === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleUpdateDraft('theme', item.id)}
                      className={`p-5 rounded-2xl border text-left transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-600/10 text-white shadow-lg shadow-blue-500/10'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                        {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                      </div>
                      <h4 className="font-bold text-xs mb-1">{item.label}</h4>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION B: TIPOGRAFIA */}
        {activeTab === 'tipo' && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-base">Tipografia, Fonte & Tamanho</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-0 space-y-6 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-300 block">Família de Fonte</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {(['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Nunito', 'Open Sans'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleUpdateDraft('fontFamily', f)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                        draft.fontFamily === f
                          ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 block">Tamanho da Fonte (Escala Global)</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'Compacto', label: 'Compacto (13px)' },
                      { id: 'Normal', label: 'Normal (14px)' },
                      { id: 'Grande', label: 'Grande (16px)' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleUpdateDraft('fontSize', s.id)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          draft.fontSize === s.id
                            ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 block">Peso da Fonte (Espessura)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'Leve', label: 'Leve' },
                      { id: 'Normal', label: 'Normal' },
                      { id: 'Semibold', label: 'Semibold' },
                      { id: 'Negrito', label: 'Negrito' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleUpdateDraft('fontWeight', w.id)}
                        className={`py-2.5 rounded-xl border text-xs font-semibold transition ${
                          draft.fontWeight === w.id
                            ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION C: CORES */}
        {activeTab === 'cores' && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Paletas de Cores Pré-definidas & HEX Personalizado</CardTitle>
              <CardDescription className="text-xs">Selecione uma paleta profissional ou ajuste os valores HEX das variáveis CSS</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-300 block">Paletas de Cores Profissionais</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {presetPalettes.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        handleUpdateDraft('primaryColor', p.primary);
                        handleUpdateDraft('secondaryColor', p.secondary);
                        handleUpdateDraft('accentColor', p.accent);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        draft.primaryColor === p.primary
                          ? 'border-blue-500 bg-slate-900 shadow-md'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-xs">{p.name}</span>
                        {draft.primaryColor === p.primary && <Check className="h-3.5 w-3.5 text-blue-400" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: p.primary }} />
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: p.secondary }} />
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: p.accent }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom HEX Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Cor Principal (--primary-color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.primaryColor}
                      onChange={(e) => handleUpdateDraft('primaryColor', e.target.value)}
                      className="h-10 w-12 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={draft.primaryColor}
                      onChange={(e) => handleUpdateDraft('primaryColor', e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Cor Secundária (--secondary-color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.secondaryColor}
                      onChange={(e) => handleUpdateDraft('secondaryColor', e.target.value)}
                      className="h-10 w-12 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={draft.secondaryColor}
                      onChange={(e) => handleUpdateDraft('secondaryColor', e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Cor de Destaque (--accent-color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.accentColor}
                      onChange={(e) => handleUpdateDraft('accentColor', e.target.value)}
                      className="h-10 w-12 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={draft.accentColor}
                      onChange={(e) => handleUpdateDraft('accentColor', e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION D: LAYOUT */}
        {activeTab === 'layout' && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Personalização de Layout & Estilo</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 block">Estilo dos Cards</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'Arredondado', label: 'Arredondado' },
                      { id: 'Moderado', label: 'Moderado (Padrão)' },
                      { id: 'Quadrado', label: 'Quadrado' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleUpdateDraft('cardStyle', c.id)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          draft.cardStyle === c.id
                            ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 block">Menu Lateral (Sidebar)</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'Expandido', label: 'Expandido (Padrão)' },
                      { id: 'Compacto', label: 'Compacto' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleUpdateDraft('sidebarMode', m.id)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          draft.sidebarMode === m.id
                            ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SECTION E: LIVE PREVIEW */}
        {(activeTab === 'previa' || true) && (
          <Card className="p-6 border-blue-500/30 bg-slate-950">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base text-white">Prévia em Tempo Real do Sistema</CardTitle>
              </div>
              <CardDescription className="text-xs">Simulação ao vivo de como a sua interface fica configurada</CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4 font-sans shadow-2xl" style={{ fontFamily: draft.fontFamily }}>
                {/* Simulated Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: draft.primaryColor }} />
                    <span className="font-bold text-white text-sm">Mundo LK System</span>
                  </div>
                  <Badge variant="info" style={{ backgroundColor: draft.accentColor, color: '#fff' }}>
                    {draft.theme.toUpperCase()} MODE
                  </Badge>
                </div>

                {/* Simulated Content Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                    <span className="text-xs text-slate-400 block font-medium">Exemplo de Card</span>
                    <h4 className="text-base font-bold text-white">iPhone 15 Pro Max 256GB</h4>
                    <p className="text-xs text-emerald-400 font-bold">R$ 7.899,00</p>
                    <button
                      type="button"
                      className="w-full py-2 px-4 rounded-lg text-xs font-bold text-white transition"
                      style={{ backgroundColor: draft.buttonColor }}
                    >
                      Botão de Ação Principal
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                    <span className="text-xs text-slate-400 block font-medium">Resumo do Estilo Selecionado</span>
                    <div className="space-y-1 text-xs text-slate-300">
                      <div>Fonte: <strong>{draft.fontFamily}</strong> ({draft.fontSize})</div>
                      <div>Cor Primária: <span className="font-mono">{draft.primaryColor}</span></div>
                      <div>Estilo Card: <strong>{draft.cardStyle}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={handleReset} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Restaurar Padrão
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={saving} leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}>
            {saving ? 'Salvando no Firebase...' : 'Salvar Alterações no Firebase'}
          </Button>
        </div>
      </form>
    </div>
  );
}
