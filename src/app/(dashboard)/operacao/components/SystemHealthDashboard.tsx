'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, RefreshCw, Server, AlertCircle, CheckCircle2, Cpu } from 'lucide-react';
import { IntegrationRegistry, DiagnosticTestResult } from '@/core/domain/services/IntegrationRegistry';
import { MarketplaceConnectionService } from '@/core/application/services/integrations/MarketplaceConnectionService';
import { Button } from '@/presentation/components/ui/Button';
import { useAuth } from '@/presentation/context/AuthContext';

export const SystemHealthDashboard: React.FC = () => {
  const { user } = useAuth();
  const [platformHealth, setPlatformHealth] = useState(100);
  const [integrationsHealth, setIntegrationsHealth] = useState(100);
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, DiagnosticTestResult>>({});
  const [isLoading, setIsLoading] = useState(false);

  const registry = IntegrationRegistry.getInstance();
  const connectors = registry.getAllConnectors();

  const runQuickDiagnostics = async () => {
    setIsLoading(true);
    const results: Record<string, DiagnosticTestResult> = {};
    let successCount = 0;

    for (const c of connectors) {
      setTestingSlug(c.slug);
      try {
        const res = await c.quickHealthCheck({});
        results[c.slug] = res;
        if (res.success) successCount++;
      } catch (err: any) {
        results[c.slug] = {
          slug: c.slug,
          name: c.name,
          success: false,
          latencyMs: 0,
          message: `🔴 Falha de comunicação: ${err?.message || String(err)}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
        };
      }
    }

    setTestingSlug(null);
    setTestResults(results);
    const pct = connectors.length > 0 ? Math.round((successCount / connectors.length) * 100) : 100;
    setIntegrationsHealth(pct);
    setIsLoading(false);
  };

  useEffect(() => {
    runQuickDiagnostics();
  }, []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:p-5 shadow-xl backdrop-blur space-y-4">
      {/* Header with Dual Health Scores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Status Geral do Sistema & Saúde das Integrações
            </h2>
            <p className="text-xs text-slate-400">
              Painel de telemetria HTTPS real, latência e estado dos conectores desacoplados.
            </p>
          </div>
        </div>

        {/* Dual Health Score Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5">
            <Server className="h-4 w-4 text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Saúde Plataforma</div>
              <div className="text-xs font-extrabold text-blue-400">{platformHealth}% OK</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Saúde Integrações</div>
              <div className="text-xs font-extrabold text-emerald-400">{integrationsHealth}% OK</div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={runQuickDiagnostics}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />}
            className="text-xs border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10"
          >
            {isLoading ? 'Testando...' : 'Diagnóstico Completo'}
          </Button>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {connectors.map((c) => {
          const res = testResults[c.slug];
          const isTesting = testingSlug === c.slug;

          let statusLabel = 'Configurado';
          let badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

          if (isTesting) {
            statusLabel = 'Testando...';
            badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse';
          } else if (res) {
            if (res.success) {
              statusLabel = 'Conectado';
              badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            } else {
              statusLabel = 'Erro Conexão';
              badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
            }
          }

          return (
            <div key={c.slug} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-white truncate">{c.name}</span>
                  <span className="text-[9px] font-mono text-slate-500">{c.connectorVersion}</span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mb-2">{c.description}</div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold border ${badgeColor}`}>
                    {res?.success ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                    {statusLabel}
                  </span>

                  {res && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {res.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>

              {res && (
                <div className={`text-[10px] p-2 rounded ${res.success ? 'bg-emerald-950/40 text-emerald-300' : 'bg-red-950/40 text-red-300'}`}>
                  {res.message}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
