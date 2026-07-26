'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Settings as SettingsIcon, Save, CheckCircle2, Loader2, Sparkles, Moon, Sun, Cpu, Share2, Trash2 } from 'lucide-react';
import { AIMemoryService } from '@/infrastructure/ai/strategies/ai-memory.service';
import { useAuth } from '@/presentation/context/AuthContext';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [writingProfile, setWritingProfile] = useState<string>('Conversa natural');
  const [favoriteChannel, setFavoriteChannel] = useState<string>('WhatsApp');
  const [aiProvider, setAiProvider] = useState<string>('gemini');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const memoryService = AIMemoryService.getInstance();

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      const mem = await memoryService.getMemoryForUser(user.uid);
      setWritingProfile(mem.preferredStyle);
      if (mem.favoriteChannels.length > 0) setFavoriteChannel(mem.favoriteChannels[0]);
      setLoading(false);
    }
    loadSettings();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccessMsg(null);

    try {
      const mem = await memoryService.getMemoryForUser(user.uid);
      mem.preferredStyle = writingProfile;
      mem.favoriteChannels = [favoriteChannel];
      await memoryService.saveMemory(mem);

      setSuccessMsg('Configurações salvas e aplicadas com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setSuccessMsg('Erro ao salvar preferências.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-xs">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
        Carregando suas preferências...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-blue-400" />
          <span>Configurações & Preferências do Sistema</span>
        </h1>
        <p className="text-sm text-slate-400">Personalize o comportamento da inteligência artificial e da interface.</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* IA Settings */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                <CardTitle className="text-base">Preferências de Geração por IA</CardTitle>
              </div>
              <Badge variant="info">Mundo LK AI Engine</Badge>
            </div>
            <CardDescription className="text-xs mt-1">Ajuste os parâmetros padrão para novas ofertas</CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Perfil de Escrita Padrão</label>
              <select
                value={writingProfile}
                onChange={(e) => setWritingProfile(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Conversa natural e persuasiva">Conversa Natural (Recomendado)</option>
                <option value="Agressivo em Vendas (Escassez e Urgência)">Agressivo em Vendas</option>
                <option value="Persuasão Máxima AIDA">Persuasão Máxima Copywriting</option>
                <option value="Elegante & Sofisticado">Elegante & Sofisticado</option>
                <option value="Informativo & Técnico">Informativo & Técnico</option>
                <option value="Casual & Descontraído">Casual & Descontraído</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Provedor de IA Padrão</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'gemini', name: 'Gemini 2.5 Flash', desc: 'Rápido & Econômico' },
                  { id: 'openai', name: 'GPT-4o-mini', desc: 'Engajamento' },
                  { id: 'claude', name: 'Claude 3.5', desc: 'Copy de Luxo' },
                  { id: 'deepseek', name: 'DeepSeek-R1', desc: 'Raciocínio Lógico' },
                ].map((prov) => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => setAiProvider(prov.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      aiProvider === prov.id
                        ? 'border-blue-500 bg-blue-600/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold">{prov.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{prov.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel & UI Settings */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-emerald-400" />
              <CardTitle className="text-base">Canal Favorito & Tema</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Canal Principal de Publicação</label>
              <select
                value={favoriteChannel}
                onChange={(e) => setFavoriteChannel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telegram">Telegram</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="Threads">Threads</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Tema da Aplicação</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                    theme === 'dark'
                      ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  <span>Modo Escuro (Padrão)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                    theme === 'light'
                      ? 'border-blue-500 bg-blue-600/10 text-blue-400'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  <span>Modo Claro</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trash Auto Clean Settings */}
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-400" />
              <CardTitle className="text-base">Configurações da Lixeira Inteligente</CardTitle>
            </div>
            <CardDescription className="text-xs">Regras de retenção para produtos excluídos temporariamente</CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Limpeza Automática de Itens na Lixeira</label>
              <select
                defaultValue="90"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="never">Nunca excluir automaticamente (Preservar Histórico)</option>
                <option value="30">Excluir definitivamente após 30 dias</option>
                <option value="90">Excluir definitivamente após 90 dias (Recomendado)</option>
              </select>
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
          {saving ? 'Salvando Configurações...' : 'Salvar Preferências'}
        </Button>
      </form>
    </div>
  );
}
