'use client';

import React, { useState, useEffect } from 'react';
import { Store, ShieldCheck, Zap, Activity, RefreshCw, Key, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { MarketplaceCentralService, MarketplaceStatusInfo } from '@/core/application/services/MarketplaceCentralService';
import { AuditCallLog } from '@/core/domain/services/MarketplaceAccessGateway';
import { Button } from '@/presentation/components/ui/Button';

export const MarketplaceCentralDashboard: React.FC = () => {
  const [mlStatus, setMlStatus] = useState<MarketplaceStatusInfo | null>(null);
  const [shopeeStatus, setShopeeStatus] = useState<MarketplaceStatusInfo | null>(null);
  const [logs, setLogs] = useState<AuditCallLog[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const centralService = MarketplaceCentralService.getInstance();

  const handleTestConnections = async () => {
    setIsTesting(true);
    const resMl = await centralService.testConnection('mercadolivre');
    const resShopee = await centralService.testConnection('shopee');

    setMlStatus(resMl);
    setShopeeStatus(resShopee);
    setLogs(centralService.getAuditLogs());
    setIsTesting(false);
  };

  useEffect(() => {
    handleTestConnections();
  }, []);

  const handleOAuthConnectMercadoLivre = () => {
    const clientId = '5566961113388868';
    const redirectUri = encodeURIComponent('https://mundo-lk.vercel.app/api/auth/mercadolivre/callback');
    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    window.open(authUrl, '_blank');
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:p-5 shadow-xl backdrop-blur space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Store className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Central de Conexões de Marketplace
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                APIs Oficiais
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Gerenciamento de conexões diretas autorizadas com Mercado Livre e Shopee sem scraping ou riscos de bloqueio.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTestConnections}
          disabled={isTesting}
          leftIcon={<RefreshCw className={`h-3.5 w-3.5 text-purple-400 ${isTesting ? 'animate-spin' : ''}`} />}
          className="text-xs border-purple-500/20 text-purple-300 hover:bg-purple-500/10 shrink-0"
        >
          {isTesting ? 'Testando...' : 'Testar Conexões API'}
        </Button>
      </div>

      {/* Cards de Status dos Marketplaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mercado Livre Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-xs font-extrabold text-amber-400 uppercase">
                Mercado Livre
              </span>
              <span className="text-[11px] font-mono text-slate-400">App ID: 5566961113388868</span>
            </div>

            {mlStatus && (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${
                mlStatus.status === 'CONNECTED'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {mlStatus.status === 'CONNECTED' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {mlStatus.status}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-900">
            <div>
              <span className="text-[10px] text-slate-500 block">Tempo de Resposta</span>
              <span className="font-bold text-slate-200">{mlStatus ? `${mlStatus.latencyMs} ms` : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Última Comunicação</span>
              <span className="font-bold text-slate-200">
                {mlStatus?.lastSyncAt ? new Date(mlStatus.lastSyncAt).toLocaleTimeString() : '—'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOAuthConnectMercadoLivre}
            leftIcon={<ExternalLink className="h-3 w-3 text-amber-400" />}
            className="w-full text-xs border-amber-500/20 text-amber-300 hover:bg-amber-500/10"
          >
            Autenticar Conta OAuth Mercado Livre
          </Button>
        </div>

        {/* Shopee Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-2 py-1 text-xs font-extrabold text-orange-400 uppercase">
                Shopee Brasil
              </span>
              <span className="text-[11px] font-mono text-slate-400">Partner ID: 18317770060</span>
            </div>

            {shopeeStatus && (
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${
                shopeeStatus.status === 'CONNECTED'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {shopeeStatus.status === 'CONNECTED' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {shopeeStatus.status}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-900">
            <div>
              <span className="text-[10px] text-slate-500 block">Tempo de Resposta</span>
              <span className="font-bold text-slate-200">{shopeeStatus ? `${shopeeStatus.latencyMs} ms` : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Assinatura HMAC-SHA256</span>
              <span className="font-bold text-emerald-400">Ativa (Partner Key)</span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-900 p-2 text-[10px] text-slate-400 flex items-center gap-1.5 border border-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Consultas assinadas via Open Platform API v2.</span>
          </div>
        </div>
      </div>

      {/* Histórico Auditado de Chamadas API */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-purple-400" /> Histórico Auditado de Requisições Gateway (Últimas 50)
        </h3>

        {logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
            Nenhuma chamada registrada no Gateway até o momento. Clique em "Testar Conexões API".
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-slate-800 bg-slate-950 p-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                    log.marketplace === 'mercadolivre' ? 'bg-amber-500/10 text-amber-400' : 'bg-orange-500/10 text-orange-400'
                  }`}>
                    {log.marketplace}
                  </span>
                  <span className="text-slate-300 font-mono text-[10px] truncate max-w-xs">{log.endpoint}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono">{log.latencyMs} ms</span>
                  <span className={`rounded-full px-2 py-0.2 text-[9px] font-bold border ${
                    log.status === 'SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : log.status === 'CACHED'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
