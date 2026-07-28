'use client';

import React, { useState } from 'react';
import {
  Key, ShieldCheck, AlertTriangle, CheckCircle2, X, RefreshCw, Info, ExternalLink, Sparkles
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/Button';
import {
  MarketplaceIntegrationManagerService,
  SystemCredentialDiagnostic,
  DiagnosticTestResult
} from '@/core/domain/services/marketplace-integration-manager.service';

interface CredentialManagerModalProps {
  onClose: () => void;
}

export const CredentialManagerModal: React.FC<CredentialManagerModalProps> = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState<SystemCredentialDiagnostic[]>(() =>
    MarketplaceIntegrationManagerService.getSystemCredentialsDiagnostic()
  );
  const [testResults, setTestResults] = useState<Record<string, DiagnosticTestResult>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);

  const configuredCount = diagnostics.filter((d) => d.isConfigured).length;
  const pendingCount = diagnostics.length - configuredCount;

  const handleTestKey = async (d: SystemCredentialDiagnostic) => {
    setTestingKey(d.keyName);
    try {
      const slugMap: Record<string, string> = {
        SHOPEE_APP_ID: 'shopee',
        MERCADOLIVRE_CLIENT_ID: 'mercadolivre',
        AMAZON_CLIENT_ID: 'amazon',
        ZENROWS_API_KEY: 'zenrows',
        APIFY_API_TOKEN: 'apify',
        GEMINI_API_KEY: 'gemini',
        OPENAI_API_KEY: 'openai',
      };
      const slug = slugMap[d.keyName] || d.keyName.toLowerCase();
      const result = await MarketplaceIntegrationManagerService.testConnection(slug);
      setTestResults((prev) => ({ ...prev, [d.keyName]: result }));
    } catch (err) {
      console.error('[Credentials] Erro ao testar credencial:', err);
    } finally {
      setTestingKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Gerenciador Central de Credenciais & APIs</h2>
              <p className="text-xs text-slate-400">
                Detecção automática de variáveis de ambiente no servidor (`process.env`).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Diagnostic Bar */}
        <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3.5 border border-slate-800 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="h-4 w-4" />
              {configuredCount} Configuradas
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <AlertTriangle className="h-4 w-4" />
              {pendingCount} Pendentes
            </div>
          </div>
          <span className="text-[11px] text-slate-400">Ambiente: Vercel / Production (.env.local)</span>
        </div>

        {/* Lista de Variáveis */}
        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
          {diagnostics.map((item) => {
            const isTesting = testingKey === item.keyName;
            const res = testResults[item.keyName];

            return (
              <div
                key={item.keyName}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/90 bg-slate-950/60 hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{item.keyName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {item.marketplace}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{item.description}</p>
                  {res && (
                    <div className={`text-[10px] font-semibold ${res.success ? 'text-emerald-400' : 'text-red-400'}`}>
                      {res.message}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold border ${
                      item.isConfigured
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {item.isConfigured ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {item.isConfigured ? 'Disponível' : 'Ausente'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleTestKey(item)}
                    disabled={isTesting}
                    className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition"
                    title="Testar Conexão Real"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin text-blue-400' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé com Orientação */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            Adicione as chaves ausentes no painel Vercel ou no arquivo `.env.local` para ativá-las automaticamente.
          </div>
          <Button type="button" variant="primary" size="sm" onClick={onClose} className="text-xs font-bold px-5">
            Concluído
          </Button>
        </div>
      </div>
    </div>
  );
};
