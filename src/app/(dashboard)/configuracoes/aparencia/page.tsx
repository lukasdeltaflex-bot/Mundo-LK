'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Palette, Moon, Sun, Monitor, Type, Save, CheckCircle2, Loader2 } from 'lucide-react';

export default function AparenciaPage() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'auto'>('dark');
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [accentColor, setAccentColor] = useState<string>('blue');
  const [cardIntensity, setCardIntensity] = useState<'soft' | 'normal' | 'high'>('normal');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    setTimeout(() => {
      setSaving(false);
      setSuccessMsg('Preferências de aparência salvas com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Palette className="h-6 w-6 text-blue-400" />
          <span>Central de Aparência & Personalização Visual</span>
        </h1>
        <p className="text-sm text-slate-400">Ajuste o tema, tipografia, cores de destaque e estilo dos cards do Mundo LK.</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Theme Selection */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Modo de Tema</CardTitle>
            <CardDescription className="text-xs">Selecione o esquema de cores preferido para a sua navegação</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'dark', label: 'Escuro (Dark Mode)', icon: Moon, desc: 'Padrão recomendado para uso contínuo' },
                { id: 'light', label: 'Claro (Light Mode)', icon: Sun, desc: 'Interface com fundo claro e alto contraste' },
                { id: 'auto', label: 'Automático', icon: Monitor, desc: 'Sincroniza com as configurações do sistema' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = themeMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setThemeMode(item.id as 'dark' | 'light' | 'auto')}
                    className={`p-4 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 font-semibold text-xs">
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-blue-400" />
              <CardTitle className="text-base">Tipografia & Tamanhos</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Família de Fonte</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFontFamily(f)}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition ${
                      fontFamily === f
                        ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Tamanho da Fonte</label>
              <div className="flex gap-2">
                {[
                  { id: 'sm', label: 'Pequeno (12px)' },
                  { id: 'md', label: 'Médio (Padrão 14px)' },
                  { id: 'lg', label: 'Grande (16px)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFontSize(s.id as 'sm' | 'md' | 'lg')}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition ${
                      fontSize === s.id
                        ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accent Colors & Card Intensity */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Cores de Destaque & Intensidade dos Cards</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Cor Principal do Sistema</label>
              <div className="flex items-center gap-3">
                {[
                  { id: 'blue', name: 'Azul Mundo LK', color: 'bg-blue-600' },
                  { id: 'emerald', name: 'Esmeralda', color: 'bg-emerald-600' },
                  { id: 'purple', name: 'Roxo VIP', color: 'bg-purple-600' },
                  { id: 'amber', name: 'Âmbar', color: 'bg-amber-600' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAccentColor(c.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
                      accentColor === c.id
                        ? 'border-white bg-slate-800 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ${c.color}`} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Intensidade de Brilho dos Cards</label>
              <div className="flex gap-2">
                {[
                  { id: 'soft', label: 'Suave' },
                  { id: 'normal', label: 'Padrão' },
                  { id: 'high', label: 'Elevado (Glassmorphism)' },
                ].map((ci) => (
                  <button
                    key={ci.id}
                    type="button"
                    onClick={() => setCardIntensity(ci.id as 'soft' | 'normal' | 'high')}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                      cardIntensity === ci.id
                        ? 'border-blue-500 bg-blue-600/10 text-blue-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {ci.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-3 text-xs font-bold"
          disabled={saving}
          leftIcon={saving ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4" />}
        >
          {saving ? 'Salvando Aparência...' : 'Salvar Personalização de Aparência'}
        </Button>
      </form>
    </div>
  );
}
