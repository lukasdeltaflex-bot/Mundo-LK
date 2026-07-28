'use client';

import React from 'react';
import { PlugZap, Activity, ExternalLink, RefreshCw, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { MarketplaceIntegrationState } from '@/core/domain/services/marketplace-integration-manager.service';
import { Button } from '@/presentation/components/ui/Button';

interface IntegrationStatusProps {
  integrations: MarketplaceIntegrationState[];
  onTestConnection: (slug: string) => void;
  onOpenCredentials: () => void;
  testingSlug?: string | null;
}

export const IntegrationStatus: React.FC<IntegrationStatusProps> = ({
  integrations,
  onTestConnection,
  onOpenCredentials,
  testingSlug,
}) => {
  const connectedCount = integrations.filter((i) => i.isConnected).length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:p-5 shadow-xl backdrop-blur space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <PlugZap className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Status das Integrações & Provedores
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {connectedCount} / {integrations.length} Ativas
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Conexões ativas de Marketplaces, Redes Sociais, Scrapers e Motores de IA.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenCredentials}
          leftIcon={<Key className="h-3.5 w-3.5 text-blue-400" />}
          className="text-xs shrink-0"
        >
          Gerenciador de Credenciais
        </Button>
      </div>

      {/* Grid conciso de integrações */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {integrations.map((item) => {
          const isTesting = testingSlug === item.slug;
          return (
            <div
              key={item.slug}
              className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-950/80 p-2.5 transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-xs font-bold text-white truncate">{item.name}</span>
                <span className={`h-2 w-2 rounded-full shrink-0 ${item.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              </div>

              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-900">
                <span className={`text-[10px] font-semibold ${item.isConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {item.isConnected ? 'Conectado' : 'Ausente'}
                </span>

                <button
                  type="button"
                  onClick={() => onTestConnection(item.slug)}
                  disabled={isTesting}
                  title="Testar Conexão"
                  className="text-[10px] font-medium text-slate-400 hover:text-blue-400 transition flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isTesting ? 'animate-spin text-blue-400' : ''}`} />
                  Testar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
