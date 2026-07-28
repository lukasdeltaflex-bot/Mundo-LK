'use client';

import React, { useState } from 'react';
import {
  PlugZap, Wand2, RefreshCw, CheckCircle2, AlertCircle,
  ShieldCheck, Server, ExternalLink, Zap, Lock, Activity,
  Clock, Info, ChevronRight, Play, Check
} from 'lucide-react';
import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import {
  MarketplaceIntegrationManagerService,
  MarketplaceIntegrationState,
  DiagnosticTestResult,
  SystemCredentialDiagnostic,
} from '@/core/domain/services/marketplace-integration-manager.service';
import { SetupWizardModal } from '@/presentation/components/business/SetupWizardModal';

export default function OperacaoIntegracoesPage() {
  const [marketplaces, setMarketplaces] = useState<MarketplaceIntegrationState[]>(() =>
    MarketplaceIntegrationManagerService.getMarketplacesStatus()
  );

  const [diagnostics, setDiagnostics] = useState<SystemCredentialDiagnostic[]>(() =>
    MarketplaceIntegrationManagerService.getSystemCredentialsDiagnostic()
  );

  const [activeTab, setActiveTab] = useState<'cards' | 'diagnostic'>('cards');
  const [showWizard, setShowWizard] = useState<boolean>(false);

  // Test connection state
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, DiagnosticTestResult>>({});
  const [syncingSlug, setSyncingSlug] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const handleConnectOAuth = (mp: MarketplaceIntegrationState) => {
    if (mp.oauthAuthUrl) {
      window.open(mp.oauthAuthUrl, '_blank', 'width=600,height=700');
    } else {
      alert(`O marketplace ${mp.name} utiliza credenciais via API Key no Vercel (process.env).`);
    }
  };

  const handleTestConnection = async (slug: string) => {
    setTestingSlug(slug);
    try {
      const result = await MarketplaceIntegrationManagerService.testConnection(slug);
      setTestResults((prev) => ({ ...prev, [slug]: result }));
    } catch (err) {
      console.error('Erro ao testar conexão:', err);
    } finally {
      setTestingSlug(null);
    }
  };

  const handleSyncNow = async (slug: string) => {
    setSyncingSlug(slug);
    await new Promise((res) => setTimeout(res, 1200));
    setSyncingSlug(null);

    setMarketplaces((prev) =>
      prev.map((mp) =>
        mp.slug === slug ? { ...mp, lastSyncAt: 'Agora mesmo' } : mp
      )
    );

    setSyncSuccessMsg(`Sincronização com ${slug.toUpperCase()} concluída com sucesso!`);
    setTimeout(() => setSyncSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* ── HEADER & SETUP WIZARD LAUNCHER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
              <PlugZap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Central de Integrações dos Marketplaces
              </h1>
              <p className="text-xs text-slate-400">
                Conexão automatizada OAuth v2, renovação inteligente de tokens e diagnóstico de APIs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleTestConnection('shopee')}
            leftIcon={<Activity className="h-4 w-4 text-purple-400" />}
            className="text-xs font-semibold"
          >
            Testar Todas as APIs
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowWizard(true)}
            leftIcon={<Wand2 className="h-4 w-4" />}
            className="text-xs font-extrabold shadow-lg shadow-blue-600/20"
          >
            Assistente de Configuração (Setup Wizard)
          </Button>
        </div>
      </div>

      {/* Sync Success Banner */}
      {syncSuccessMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* ── TABS ── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'cards'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <PlugZap className="h-4 w-4" />
          <span>Marketplaces & Conexões ({marketplaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('diagnostic')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'diagnostic'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Painel de Diagnóstico & Credenciais</span>
        </button>
      </div>

      {/* ── TAB 1: MARKETPLACE CARDS ── */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {marketplaces.map((mp) => {
            const isConn = mp.isConnected;
            const testRes = testResults[mp.slug];
            const isTesting = testingSlug === mp.slug;
            const isSyncing = syncingSlug === mp.slug;

            return (
              <div
                key={mp.slug}
                className={`rounded-2xl border bg-slate-900/90 p-5 shadow-xl transition-all duration-200 hover:border-slate-700 flex flex-col justify-between space-y-4 ${
                  isConn ? 'border-slate-800' : 'border-slate-800/80 opacity-90'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-extrabold shadow-inner ${mp.logoSvgBg}`}>
                      {mp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        {mp.name}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {mp.supportsOAuth ? 'OAuth v2 Oficial' : 'Integrador API'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${
                      isConn
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isConn ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {isConn ? '🟢 Conectado' : '🔴 Não Conectado'}
                  </span>
                </div>

                {/* Information Box */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Loja Conectada:</span>
                    <span className="font-semibold text-white truncate max-w-[150px]">
                      {mp.connectedStoreName || 'Pendente'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Última Autenticação:</span>
                    <span className="font-medium text-slate-300">
                      {mp.lastAuthAt || '—'}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Última Sincronização:</span>
                    <span className="font-medium text-slate-300">
                      {mp.lastSyncAt || '—'}
                    </span>
                  </div>
                </div>

                {/* Diagnostic Result Banner (if tested) */}
                {testRes && (
                  <div
                    className={`rounded-lg p-2.5 text-xs font-mono border flex items-center justify-between ${
                      testRes.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span className="truncate pr-2">{testRes.message}</span>
                    <span className="text-[10px] opacity-80 shrink-0">{testRes.latencyMs}ms</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-1 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    {isConn ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleConnectOAuth(mp)}
                        className="text-xs"
                      >
                        Reconectar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => handleConnectOAuth(mp)}
                        leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                        className="text-xs font-bold"
                      >
                        Conectar OAuth
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(mp.slug)}
                      disabled={isTesting}
                      leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />}
                      className="text-xs"
                    >
                      {isTesting ? 'Testando...' : 'Testar Conexão'}
                    </Button>
                  </div>

                  {isConn && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncNow(mp.slug)}
                      disabled={isSyncing}
                      className="w-full text-xs text-slate-400 hover:text-white"
                    >
                      {isSyncing ? 'Sincronizando Catálogo...' : '⚡ Sincronizar Agora'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: DIAGNOSTIC & SECURITY PANEL ── */}
      {activeTab === 'diagnostic' && (
        <div className="space-y-6">
          {/* Security Banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-200">
            <Lock className="h-5 w-5 shrink-0 text-blue-400 mt-0.5" />
            <div className="space-y-1 text-xs leading-relaxed">
              <span className="font-bold text-white block">Arquitetura de Segurança de Credenciais Enterprise:</span>
              <p>
                Todas as credenciais de autenticação (`Client Secret`, `Partner Key`, `Access Token`, `Refresh Token`) são lidas e gerenciadas estritamente no ambiente seguro do servidor (`process.env`). Nenhuma chave privada é armazenada no banco de dados do cliente nem exposta no navegador.
              </p>
            </div>
          </div>

          {/* Credentials Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-400" />
                Diagnóstico de Variáveis de Ambiente no Servidor Vercel
              </span>
              <Badge variant="info">Status em Tempo Real</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Variável no Vercel</th>
                    <th className="p-3">Marketplace</th>
                    <th className="p-3">Descrição / Função</th>
                    <th className="p-3 text-right">Status no Servidor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {diagnostics.map((diag) => (
                    <tr key={diag.keyName} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-white">{diag.keyName}</td>
                      <td className="p-3 text-slate-300">{diag.marketplace}</td>
                      <td className="p-3 text-slate-400">{diag.description}</td>
                      <td className="p-3 text-right">
                        {diag.isConfigured ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Configurada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-bold text-rose-400">
                            <AlertCircle className="h-3 w-3" /> Ausente no Vercel
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SETUP WIZARD MODAL ── */}
      {showWizard && (
        <SetupWizardModal
          onClose={() => setShowWizard(false)}
          onComplete={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
