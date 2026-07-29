'use client';

import React from 'react';
import {
  PlugZap, RefreshCw, Key, CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles
} from 'lucide-react';
import {
  MarketplaceIntegrationState,
  DiagnosticTestResult
} from '@/core/domain/services/marketplace-integration-manager.service';
import { Button } from '@/presentation/components/ui/Button';

interface IntegrationStatusProps {
  integrations: MarketplaceIntegrationState[];
  onTestConnection: (slug: string) => void;
  onOpenCredentials: (slug?: string) => void;
  testingSlug?: string | null;
  testResults?: Record<string, DiagnosticTestResult>;
}

export const IntegrationStatus: React.FC<IntegrationStatusProps> = ({
  integrations,
  onTestConnection,
  onOpenCredentials,
  testingSlug,
  testResults = {},
}) => {
  const connectedCount = integrations.filter((i) => i.isConnected).length;
  const missingCount = integrations.length - connectedCount;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:p-5 shadow-xl backdrop-blur space-y-4">
      {/* ── HEADER DE STATUS DAS INTEGRAÇÕES ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <PlugZap className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Diagnóstico de Credenciais & Provedores
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {connectedCount} Conectadas
              </span>
              {missingCount > 0 && (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  {missingCount} Pendentes
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400">
              Disponibilidade real detectada no servidor. Chaves ausentes exibem o status &quot;Não configurado&quot;.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenCredentials()}
          leftIcon={<Key className="h-3.5 w-3.5 text-blue-400" />}
          className="text-xs shrink-0 border-blue-500/20 text-blue-300 hover:bg-blue-500/10"
        >
          Gerenciador de Credenciais
        </Button>
      </div>

      {/* ── GRID DE CARDS COM ESTADOS DE UX ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {integrations.map((item) => {
          const isTesting = testingSlug === item.slug;
          const result = testResults[item.slug];

          // Determinar status UX real sem simulações falsas
          let statusLabel = 'Não configurado';
          let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
          let DotIcon = AlertTriangle;

          if (item.isConnected) {
            statusLabel = 'Conectado';
            badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            DotIcon = CheckCircle2;
          } else if (item.status === 'ERROR') {
            statusLabel = 'Erro Conexão';
            badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
            DotIcon = AlertCircle;
          }

          return (
            <div
              key={item.slug}
              className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-950/80 p-2.5 transition-all hover:border-slate-700"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-bold text-white truncate">{item.name}</span>
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      item.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500/80'
                    }`}
                  />
                </div>

                <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${badgeColor} mb-2`}>
                  <DotIcon className="h-2.5 w-2.5" />
                  {statusLabel}
                </div>
              </div>

              {result && (
                <div
                  className={`text-[9px] p-1 rounded mb-1.5 ${
                    result.success ? 'bg-emerald-950/50 text-emerald-300' : 'bg-red-950/50 text-red-300'
                  }`}
                >
                  {result.message}
                </div>
              )}

              <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => onTestConnection(item.slug)}
                  disabled={isTesting}
                  title="Testar Conexão Real"
                  className="text-[10px] font-medium text-slate-400 hover:text-blue-400 transition flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin text-blue-400' : ''}`} />
                  {isTesting ? 'Testando...' : 'Testar'}
                </button>

                {!item.isConnected && (
                  <button
                    type="button"
                    onClick={() => onOpenCredentials(item.slug)}
                    className="text-[10px] font-semibold text-blue-400 hover:underline"
                  >
                    Configurar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
