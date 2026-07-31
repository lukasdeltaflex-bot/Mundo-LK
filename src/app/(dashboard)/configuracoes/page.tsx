'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import {
  Settings as SettingsIcon, Save, CheckCircle2, Loader2, Sparkles, Moon, Sun,
  Palette, Database, User as UserIcon, Shield, Bell, PlugZap, Cpu, Layers,
  Download, Upload, Type, RefreshCw, X, ArrowRight
} from 'lucide-react';
import { AIMemoryService } from '@/infrastructure/ai/strategies/ai-memory.service';
import { useAuth } from '@/presentation/context/AuthContext';
import {
  useAppearance,
  type FontOption,
  type AppearanceSettings,
} from '@/presentation/context/AppearanceContext';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';
import Link from 'next/link';

export interface UIBackupLog {
  id: string;
  type: string;
  format: string;
  size: string;
  date: string;
  status: string;
}

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

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const initialTab = searchParams.get('tab') || 'perfil';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // ─── AI & General Prefs State ─────────────────────────────────────────────
  const [writingProfile, setWritingProfile] = useState<string>('Conversa natural');
  const [favoriteChannel, setFavoriteChannel] = useState<string>('WhatsApp');
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Appearance State ──────────────────────────────────────────────────────
  const { settings, commitSettings, resetToDefault, isLoading: loadingApp } = useAppearance();
  const [draftApp, setDraftApp] = useState<AppearanceSettings>(settings);
  const [savingApp, setSavingApp] = useState(false);

  // ─── Backup State ─────────────────────────────────────────────────────────
  const [backups, setBackups] = useState<UIBackupLog[]>([]);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const memoryService = AIMemoryService.getInstance();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  useEffect(() => {
    setDraftApp(settings);
  }, [settings]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const mem = await memoryService.getMemoryForUser(user.uid);
        setWritingProfile(mem.preferredStyle);
        if (mem.favoriteChannels.length > 0) setFavoriteChannel(mem.favoriteChannels[0]);

        const q = query(collection(db, 'backup_logs'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list: UIBackupLog[] = snap.docs.map((d) => d.data() as UIBackupLog);
        setBackups(list);
      } catch (err) {
        console.warn('[ConfiguracoesPage] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/configuracoes?tab=${tab}`, { scroll: false });
  };

  // ─── Handlers: General Prefs ───────────────────────────────────────────────
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingGeneral(true);
    setSuccessMsg(null);
    try {
      const mem = await memoryService.getMemoryForUser(user.uid);
      mem.preferredStyle = writingProfile;
      mem.favoriteChannels = [favoriteChannel];
      await memoryService.saveMemory(mem);
      setSuccessMsg('Configurações de IA e Perfil salvas com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setSuccessMsg('Erro ao salvar preferências.');
    } finally {
      setSavingGeneral(false);
    }
  };

  // ─── Handlers: Appearance ──────────────────────────────────────────────────
  const handleSaveAppearance = async () => {
    setSavingApp(true);
    try {
      await commitSettings(draftApp);
      setSuccessMsg('Aparência atualizada e salva com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setSavingApp(false);
    }
  };

  const handleResetAppearance = async () => {
    setSavingApp(true);
    try {
      await resetToDefault();
      setSuccessMsg('Aparência restaurada para as configurações padrão!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setSavingApp(false);
    }
  };

  // ─── Handlers: Backup ──────────────────────────────────────────────────────
  const handleExportJSON = async () => {
    if (!user?.uid) return;
    setExporting(true);
    try {
      const uid = user.uid;
      const prodRepo = new FirestoreProductRepository();
      const offerRepo = new FirestoreOfferRepository();

      const products = await prodRepo.findAll(uid);
      const offers = await offerRepo.findByUserId(uid);

      const backupData = {
        app: 'Mundo LK',
        version: '4.0.0',
        exportedAt: new Date().toISOString(),
        products,
        offers,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mundo-lk-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccessMsg('Backup exportado com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.products || !data.offers) {
        alert('Arquivo de backup inválido.');
        return;
      }

      const uid = user?.uid || 'guest';
      const prodRepo = new FirestoreProductRepository();
      const offerRepo = new FirestoreOfferRepository();

      for (const p of data.products) {
        await prodRepo.save({ ...p, userId: uid });
      }

      for (const o of data.offers) {
        await offerRepo.save({ ...o, userId: uid });
      }

      setSuccessMsg(`Restauração concluída: ${data.products.length} produtos e ${data.offers.length} ofertas importadas!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Erro ao importar backup: ' + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading || loadingApp) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-xs gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        Carregando Central de Configurações...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-blue-400" />
          <span>Configurações do Sistema</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Central unificada de preferências de perfil, inteligência artificial, tema/aparência, backups e integridade.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => switchTab('perfil')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'perfil'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserIcon className="h-4 w-4" /> Perfil & IA
        </button>

        <button
          onClick={() => switchTab('aparencia')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'aparencia'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="h-4 w-4 text-purple-400" /> Aparência
        </button>

        <button
          onClick={() => switchTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'backup'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="h-4 w-4 text-emerald-400" /> Backup Manager
        </button>

        <button
          onClick={() => switchTab('integracoes')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'integracoes'
              ? 'border-blue-500 text-blue-400 bg-slate-900/60 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlugZap className="h-4 w-4 text-amber-400" /> Integrações
        </button>

        <Link
          href="/configuracoes/organizar-menu"
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-200 whitespace-nowrap ml-auto"
        >
          <Layers className="h-4 w-4 text-blue-400" /> Organizar Menu
        </Link>
      </div>

      {/* ─── TAB 1: PERFIL & IA ───────────────────────────────────────────────── */}
      {activeTab === 'perfil' && (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <CardTitle className="text-base">Preferências da Inteligência Artificial</CardTitle>
                </div>
                <Badge variant="info">Google Gemini 2.5 Flash</Badge>
              </div>
              <CardDescription className="text-xs mt-1">Ajuste o comportamento do assistente comercial</CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Perfil de Escrita Padrão</label>
                <select
                  value={writingProfile}
                  onChange={(e) => setWritingProfile(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Conversa natural">Conversa Natural (Acolhedor)</option>
                  <option value="Explosivo de Achados">Explosivo de Achados (Urgência & Promoção)</option>
                  <option value="Premium & Luxo">Premium & Luxo (Sofisticado)</option>
                  <option value="Direto e Conciso">Direto e Conciso (Minimalista)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Canal Principal de Divulgação</label>
                <select
                  value={favoriteChannel}
                  onChange={(e) => setFavoriteChannel(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="WhatsApp">WhatsApp / Grupos de Promoção</option>
                  <option value="Telegram">Telegram Channel</option>
                  <option value="Instagram">Instagram Stories & Feed</option>
                  <option value="Facebook">Facebook Groups</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={savingGeneral}
              leftIcon={savingGeneral ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            >
              {savingGeneral ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </div>
        </form>
      )}

      {/* ─── TAB 2: APARÊNCIA ───────────────────────────────────────────────── */}
      {activeTab === 'aparencia' && (
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-purple-400" />
                  <CardTitle className="text-base">Personalização Visual do Sistema</CardTitle>
                </div>
                <Badge variant="info">Persistente no Firestore</Badge>
              </div>
              <CardDescription className="text-xs mt-1">Defina o tema, modo de exibição e fontes principais</CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-6 text-xs">
              {/* Modos de Tema */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300">Modo de Exibição</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDraftApp({ ...draftApp, theme: 'dark' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                      draftApp.theme === 'dark'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className="h-4 w-4 text-blue-400" /> Modo Escuro (Padrão)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraftApp({ ...draftApp, theme: 'light' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition ${
                      draftApp.theme === 'light'
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className="h-4 w-4 text-amber-400" /> Modo Claro
                  </button>
                </div>
              </div>

              {/* Seletor de Cores de Destaque */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300">Cor Principal de Destaque</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setDraftApp({ ...draftApp, primaryColor: c.value })}
                      className={`h-10 rounded-xl border-2 transition flex items-center justify-center ${
                        draftApp.primaryColor === c.value ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    >
                      {draftApp.primaryColor === c.value && <CheckCircle2 className="h-4 w-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo de Fonte */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300">Tipografia da Interface</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FONTS.map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => setDraftApp({ ...draftApp, fontFamily: font })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                        draftApp.fontFamily === font
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetAppearance}
              disabled={savingApp}
              leftIcon={<RefreshCw className="h-4 w-4 text-slate-400" />}
              className="border-slate-800 text-slate-400 hover:text-white"
            >
              Restaurar Padrão
            </Button>

            <Button
              type="button"
              onClick={handleSaveAppearance}
              disabled={savingApp}
              leftIcon={savingApp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            >
              {savingApp ? 'Salvando...' : 'Salvar Alterações de Aparência'}
            </Button>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BACKUP MANAGER ───────────────────────────────────────────── */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <CardTitle className="text-base">Backup & Restauração dos Dados</CardTitle>
                </div>
                <Badge variant="success">Segurança Total</Badge>
              </div>
              <CardDescription className="text-xs mt-1">Exportação e importação completa de ofertas, produtos e configurações</CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Exportar */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Download className="h-4 w-4 text-emerald-400" /> Exportar Backup (JSON)
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Baixe uma cópia de segurança contendo todas as suas ofertas, produtos e memórias de Inteligência Artificial.
                  </p>
                  <Button
                    type="button"
                    onClick={handleExportJSON}
                    disabled={exporting}
                    leftIcon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    className="w-full text-xs py-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {exporting ? 'Gerando Backup...' : 'Exportar JSON Completo'}
                  </Button>
                </div>

                {/* Importar */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Upload className="h-4 w-4 text-blue-400" /> Importar / Restaurar Backup
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Restaure ofertas e dados previamente exportados de um arquivo JSON do Mundo LK.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    leftIcon={importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    className="w-full text-xs py-2 border-slate-800 text-slate-200 hover:bg-slate-900"
                  >
                    {importing ? 'Restaurando...' : 'Selecionar Arquivo JSON'}
                  </Button>
                </div>
              </div>

              {/* Histórico de Backups */}
              {backups.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h4 className="font-bold text-slate-300">Histórico Recente de Backups</h4>
                  <div className="space-y-2">
                    {backups.slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="font-bold text-white">{b.type} ({b.format})</span>
                          <span className="text-slate-400 text-[11px]">• {b.size}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{b.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── TAB 4: INTEGRAÇÕES ────────────────────────────────────────────── */}
      {activeTab === 'integracoes' && (
        <Card className="p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlugZap className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-base">Integrações de Marketplaces</CardTitle>
              </div>
              <Badge variant="warning">Gateway Oficial</Badge>
            </div>
            <CardDescription className="text-xs mt-1">Conexões oficiais com Mercado Livre e Shopee</CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4 text-xs">
            <p className="text-slate-300">
              Gerencie suas credenciais e chaves da API do Mercado Livre e da Shopee na Central de Marketplaces dedicada.
            </p>

            <Link href="/operacao">
              <Button leftIcon={<ArrowRight className="h-4 w-4" />}>
                Abrir Central de Marketplaces
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
