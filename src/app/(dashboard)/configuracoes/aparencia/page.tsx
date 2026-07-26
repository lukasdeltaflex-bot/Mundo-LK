'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Palette, Moon, Sun, Monitor, Type, Save, CheckCircle2, Loader2, RefreshCw, Layout, Eye, Sparkles, Check, Sliders, Layers } from 'lucide-react';
import { useAppearance, defaultFullSettings, FullAppearanceSettings } from '@/presentation/context/AppearanceContext';

export default function AparenciaPage() {
  const { settings, updateSettings, resetToDefault, isLoading } = useAppearance();

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'tema' | 'cores' | 'layout' | 'elementos' | 'tipo'>('tema');

  const presetPalettes = [
    { name: 'Azul Profissional', primary: '#2563EB', secondary: '#1E40AF', accent: '#10B981', sidebar: '#0F172A', card: '#1E293B' },
    { name: 'Verde Moderno', primary: '#10B981', secondary: '#047857', accent: '#3B82F6', sidebar: '#064E3B', card: '#065F46' },
    { name: 'Roxo Premium', primary: '#7C3AED', secondary: '#5B21B6', accent: '#F59E0B', sidebar: '#2E1065', card: '#3B0764' },
    { name: 'Laranja Energia', primary: '#F97316', secondary: '#C2410C', accent: '#10B981', sidebar: '#431407', card: '#7C2D12' },
    { name: 'Vermelho Impacto', primary: '#EF4444', secondary: '#B91C1C', accent: '#3B82F6', sidebar: '#450A0A', card: '#7F1D1D' },
    { name: 'Cinza Minimalista', primary: '#4B5563', secondary: '#1F2937', accent: '#6B7280', sidebar: '#111827', card: '#1F2937' },
    { name: 'Preto Elegante', primary: '#111827', secondary: '#000000', accent: '#2563EB', sidebar: '#030712', card: '#111827' },
  ];

  const handleUpdate = (key: keyof FullAppearanceSettings, value: unknown) => {
    updateSettings({ [key]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      await updateSettings(settings);
      setSuccessMsg('Todas as personalizações foram sincronizadas no Firebase e salvas com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      setSuccessMsg('Erro ao salvar no Firebase.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Deseja restaurar todas as configurações visuais para o padrão do sistema?')) {
      await resetToDefault();
      setSuccessMsg('Configurações visuais restauradas para o padrão original.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-xs">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
        Carregando Central Profissional de Aparência...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Palette className="h-6 w-6 text-blue-400" />
            <span>Central Definitiva de Aparência</span>
          </h1>
          <p className="text-sm text-slate-400">Personalização em tempo real de temas, paletas, layout, botões, cards e tipografia.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="text-xs" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={handleReset}>
            Restaurar Padrão
          </Button>
          <Button size="sm" variant="primary" className="text-xs" disabled={saving} leftIcon={saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} onClick={handleSave}>
            {saving ? 'Salvando...' : 'Salvar no Firebase'}
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'tema', label: '1) Modo de Tema', icon: Moon },
          { id: 'cores', label: '2) Cores & Paletas', icon: Palette },
          { id: 'elementos', label: '3) Cards & Botões', icon: Layers },
          { id: 'tipo', label: '4) Tipografia & Fonte', icon: Type },
          { id: 'layout', label: '5) Layout & Espaçamento', icon: Layout },
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as 'tema' | 'cores' | 'layout' | 'elementos' | 'tipo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. MODO DE TEMA */}
        {activeSection === 'tema' && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Modo de Tema</CardTitle>
              <CardDescription className="text-xs">Aplicação instantânea de tema visual no DOM</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'dark', label: 'Modo Escuro (Dark)', icon: Moon, desc: 'Interface escura de alta fidelidade e menor estresse ocular' },
                  { id: 'light', label: 'Modo Claro (Light)', icon: Sun, desc: 'Fundo claro com máximo contraste para ambientes iluminados' },
                  { id: 'auto', label: 'Sincronizar com Sistema', icon: Monitor, desc: 'Acompanha automaticamente as preferências do seu dispositivo' },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = settings.theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleUpdate('theme', t.id)}
                      className={`p-5 rounded-2xl border text-left transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-600/10 text-white shadow-lg'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                        {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                      </div>
                      <h4 className="font-bold text-xs mb-1">{t.label}</h4>
                      <p className="text-[11px] text-slate-500">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2. CORES & PALETAS */}
        {activeSection === 'cores' && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Paletas de Cores Pré-definidas & Personalizadas</CardTitle>
              <CardDescription className="text-xs">Selecione um tema de cores profissional ou escolha livremente no seletor HEX</CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-6 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-300 block">Paletas Prontas (1 Clique)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {presetPalettes.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        handleUpdate('primaryColor', p.primary);
                        handleUpdate('secondaryColor', p.secondary);
                        handleUpdate('accentColor', p.accent);
                        handleUpdate('sidebarBg', p.sidebar);
                        handleUpdate('cardBg', p.card);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        settings.primaryColor === p.primary
                          ? 'border-blue-500 bg-slate-900 shadow-md'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-xs">{p.name}</span>
                        {settings.primaryColor === p.primary && <Check className="h-3.5 w-3.5 text-blue-400" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: p.primary }} />
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: p.secondary }} />
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: p.accent }} />
                        <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: p.card }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* HEX Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-4 border-t border-slate-800">
                {[
                  { label: 'Cor Principal', key: 'primaryColor', val: settings.primaryColor },
                  { label: 'Cor Secundária', key: 'secondaryColor', val: settings.secondaryColor },
                  { label: 'Cor Destaque', key: 'accentColor', val: settings.accentColor },
                  { label: 'Fundo Sidebar', key: 'sidebarBg', val: settings.sidebarBg },
                  { label: 'Fundo Cards', key: 'cardBg', val: settings.cardBg },
                ].map((item) => (
                  <div key={item.key} className="space-y-1">
                    <label className="font-semibold text-slate-300 block">{item.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={item.val}
                        onChange={(e) => handleUpdate(item.key as keyof FullAppearanceSettings, e.target.value)}
                        className="h-9 w-10 rounded bg-slate-950 border border-slate-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={item.val}
                        onChange={(e) => handleUpdate(item.key as keyof FullAppearanceSettings, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. CARDS & BOTÕES */}
        {activeSection === 'elementos' && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Estilo dos Cards, Botões & Sombras</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 block">Arredondamento dos Cards</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'Quadrado', label: 'Quadrado (Reto)' },
                      { id: 'Moderado', label: 'Moderado (Padrão)' },
                      { id: 'Arredondado', label: 'Super Arredondado' },
                    ].map((cr) => (
                      <button
                        key={cr.id}
                        type="button"
                        onClick={() => handleUpdate('cardRadius', cr.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition ${
                          settings.cardRadius === cr.id
                            ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cr.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 block">Estilo dos Botões</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'Reto', label: 'Reto (Canto Fino)' },
                      { id: 'Arredondado', label: 'Arredondado' },
                      { id: 'Pílula', label: 'Estilo Pílula (Full)' },
                    ].map((bs) => (
                      <button
                        key={bs.id}
                        type="button"
                        onClick={() => handleUpdate('buttonStyle', bs.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition ${
                          settings.buttonStyle === bs.id
                            ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {bs.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 block">Intensidade da Sombra</label>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'Nenhuma', label: 'Sem Sombra' },
                      { id: 'Suave', label: 'Sombra Suave' },
                      { id: 'Marcada', label: 'Sombra Marcada' },
                      { id: 'Elevada', label: 'Sombra Elevada' },
                    ].map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => handleUpdate('cardShadow', sh.id)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-left transition ${
                          settings.cardShadow === sh.id
                            ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. TIPOGRAFIA */}
        {activeSection === 'tipo' && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Tipografia, Fonte & Tamanho</CardTitle>
            </CardHeader>

            <CardContent className="p-0 space-y-6 text-xs">
              <div className="space-y-2">
                <label className="font-semibold text-slate-300 block">Família da Fonte</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {(['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Nunito', 'Open Sans'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleUpdate('fontFamily', f)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                        settings.fontFamily === f
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
                  <label className="font-semibold text-slate-300 block">Escala do Tamanho de Fonte</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'Compacto', label: 'Compacto (13px)' },
                      { id: 'Normal', label: 'Normal (14px)' },
                      { id: 'Grande', label: 'Grande (16px)' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleUpdate('fontSize', s.id)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          settings.fontSize === s.id
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
                  <label className="font-semibold text-slate-300 block">Peso da Fonte</label>
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
                        onClick={() => handleUpdate('fontWeight', w.id)}
                        className={`py-2.5 rounded-xl border text-xs font-semibold transition ${
                          settings.fontWeight === w.id
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

        {/* 5. LAYOUT & ESPAÇAMENTO */}
        {activeSection === 'layout' && (
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base">Layout & Espaçamento Global</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 block">Espaçamento do Layout</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'Compacto', label: 'Compacto' },
                      { id: 'Normal', label: 'Normal' },
                      { id: 'Espaçoso', label: 'Espaçoso' },
                    ].map((sp) => (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => handleUpdate('layoutSpacing', sp.id)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          settings.layoutSpacing === sp.id
                            ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sp.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 block">Modo da Sidebar</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'Expandido', label: 'Expandido' },
                      { id: 'Compacto', label: 'Compacto' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleUpdate('sidebarMode', m.id)}
                        className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition ${
                          settings.sidebarMode === m.id
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

        {/* LIVE SYSTEM PREVIEW BOX */}
        <Card className="p-6 border-blue-500/40 bg-slate-950">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-400" />
              <CardTitle className="text-base text-white">Prévia em Tempo Real da Sua Interface</CardTitle>
            </div>
            <CardDescription className="text-xs">Veja como todos os elementos visuais mudam instantaneamente</CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <div className="rounded-2xl border border-slate-800 p-5 space-y-4 shadow-2xl transition-all" style={{ backgroundColor: settings.sidebarBg, fontFamily: settings.fontFamily }}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: settings.primaryColor }} />
                  <span className="font-bold text-white text-sm">Mundo LK — Dashboard Real</span>
                </div>
                <Badge variant="info" style={{ backgroundColor: settings.accentColor, color: '#fff' }}>
                  {settings.theme.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/10 space-y-3" style={{ backgroundColor: settings.cardBg }}>
                  <span className="text-xs text-slate-400 block font-medium">Card de Exemplo</span>
                  <h4 className="text-sm font-bold text-white">iPhone 15 Pro Max 256GB Titanium</h4>
                  <p className="text-xs font-bold text-emerald-400">R$ 7.899,00</p>
                  <button
                    type="button"
                    className="w-full py-2 px-3 text-xs font-bold text-white shadow-md transition"
                    style={{ backgroundColor: settings.primaryColor, borderRadius: settings.buttonStyle === 'Pílula' ? '9999px' : settings.buttonStyle === 'Reto' ? '2px' : '8px' }}
                  >
                    Botão de Ação Principal
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-white/10 space-y-2 text-xs text-slate-300" style={{ backgroundColor: settings.cardBg }}>
                  <span className="font-bold text-white block mb-1">Métricas de Personalização:</span>
                  <div>Fonte: <strong>{settings.fontFamily}</strong> ({settings.fontSize})</div>
                  <div>Arredondamento: <strong>{settings.cardRadius}</strong></div>
                  <div>Estilo Botão: <strong>{settings.buttonStyle}</strong></div>
                  <div>Espaçamento: <strong>{settings.layoutSpacing}</strong></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
