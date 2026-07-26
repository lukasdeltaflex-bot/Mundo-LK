'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Palette, Moon, Sun, Monitor, Type, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { useAppearance } from '@/presentation/context/AppearanceContext';

export default function AparenciaPage() {
  const { settings, updateSettings, isLoading } = useAppearance();

  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'auto'>(settings.theme);
  const [fontFamily, setFontFamily] = useState<'Inter' | 'Roboto' | 'Open Sans' | 'Poppins' | 'Montserrat'>(settings.fontFamily);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>(settings.fontSize);
  const [primaryColor, setPrimaryColor] = useState<string>(settings.primaryColor);
  const [buttonColor, setButtonColor] = useState<string>(settings.buttonColor);
  const [accentColor, setAccentColor] = useState<string>(settings.accentColor);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      setThemeMode(settings.theme);
      setFontFamily(settings.fontFamily);
      setFontSize(settings.fontSize);
      setPrimaryColor(settings.primaryColor);
      setButtonColor(settings.buttonColor);
      setAccentColor(settings.accentColor);
    }
  }, [settings, isLoading]);

  const handleApplyTheme = async (newTheme: 'dark' | 'light' | 'auto') => {
    setThemeMode(newTheme);
    await updateSettings({ theme: newTheme });
  };

  const handleApplyFont = async (newFont: 'Inter' | 'Roboto' | 'Open Sans' | 'Poppins' | 'Montserrat') => {
    setFontFamily(newFont);
    await updateSettings({ fontFamily: newFont });
  };

  const handleApplySize = async (newSize: 'sm' | 'md' | 'lg') => {
    setFontSize(newSize);
    await updateSettings({ fontSize: newSize });
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    try {
      await updateSettings({
        theme: themeMode,
        fontFamily,
        fontSize,
        primaryColor,
        buttonColor,
        accentColor,
      });

      setSuccessMsg('Configurações de Aparência salvas no Firebase e aplicadas em tempo real!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      setSuccessMsg('Erro ao salvar preferências no Firebase.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-xs">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
        Carregando preferências de aparência...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Palette className="h-6 w-6 text-blue-400" />
          <span>Central de Aparência & Personalização Visual</span>
        </h1>
        <p className="text-sm text-slate-400">Personalização em tempo real com sincronização automática no Firebase.</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Theme Selection */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Modo de Tema</CardTitle>
            <CardDescription className="text-xs">Selecione o esquema de cores e aplique imediatamente</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'dark', label: 'Escuro (Dark Mode)', icon: Moon, desc: 'Fundo escuro recomendado' },
                { id: 'light', label: 'Claro (Light Mode)', icon: Sun, desc: 'Fundo claro e alto contraste' },
                { id: 'auto', label: 'Automático', icon: Monitor, desc: 'Sincroniza com o SO' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = themeMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleApplyTheme(item.id as 'dark' | 'light' | 'auto')}
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

        {/* Typography Selection */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-blue-400" />
              <CardTitle className="text-base">Tipografia & Fonte Global</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Família de Fonte</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleApplyFont(f)}
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
              <label className="font-semibold text-slate-300">Tamanho da Fonte (Escala Global)</label>
              <div className="flex gap-2">
                {[
                  { id: 'sm', label: 'Pequeno (13px)' },
                  { id: 'md', label: 'Médio (14px Padrão)' },
                  { id: 'lg', label: 'Grande (16px)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleApplySize(s.id as 'sm' | 'md' | 'lg')}
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

        {/* Custom Colors */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Cores Personalizadas CSS (--primary, --button, --accent)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Cor Principal</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-12 rounded bg-slate-950 border border-slate-800 cursor-pointer"
                  />
                  <span className="font-mono text-slate-300">{primaryColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Cor dos Botões</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    className="h-9 w-12 rounded bg-slate-950 border border-slate-800 cursor-pointer"
                  />
                  <span className="font-mono text-slate-300">{buttonColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Cor dos Destaques</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-9 w-12 rounded bg-slate-950 border border-slate-800 cursor-pointer"
                  />
                  <span className="font-mono text-slate-300">{accentColor}</span>
                </div>
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
          {saving ? 'Salvando no Firebase...' : 'Salvar Personalização de Aparência no Firebase'}
        </Button>
      </form>
    </div>
  );
}
