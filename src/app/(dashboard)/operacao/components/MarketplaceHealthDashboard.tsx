'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/presentation/context/AuthContext';
import { MarketplaceHealthService } from '@/core/application/services/integrations/MarketplaceHealthService';
import { MarketplaceHealth } from '@/core/domain/entities/marketplace-health.entity';
import { MarketplaceStatistics } from '@/core/domain/value-objects/MarketplaceStatistics';
import { MarketplaceConnectionSlug } from '@/core/domain/entities/marketplace-connection.entity';
import {
  Activity, RefreshCw, Zap, ShieldCheck, AlertTriangle, Key, Wrench, Layers, CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  onOpenCredentials: () => void;
}

export function MarketplaceHealthDashboard({ onOpenCredentials }: DashboardProps) {
  const { user } = useAuth();
  const [healthList, setHealthList] = useState<MarketplaceHealth[]>([]);
  const [stats, setStats] = useState<MarketplaceStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const availableChannels: Array<{ slug: MarketplaceConnectionSlug; name: string; type: string }> = [
    { slug: 'mercadolivre', name: 'Mercado Livre Brasil', type: 'Marketplace' },
    { slug: 'shopee', name: 'Shopee Brasil', type: 'Marketplace' },
    { slug: 'whatsapp', name: 'WhatsApp Cloud API', type: 'Canal Social' },
    { slug: 'gemini', name: 'Google Gemini 2.5', type: 'IA Core' },
    { slug: 'openai', name: 'OpenAI GPT-4o', type: 'IA Core' },
  ];

  const loadHealthData = useCallback(async (force: boolean = false) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const service = MarketplaceHealthService.getInstance();
      const list: MarketplaceHealth[] = [];

      for (const ch of availableChannels) {
        const h = await service.checkHealth(user.uid, ch.slug, force);
        list.push(h);
      }

      setHealthList(list);
      const s = await service.getStatistics(user.uid);
      setStats(s);
    } catch (err) {
      console.warn('[MarketplaceHealthDashboard] error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHealthData(false);
  }, [loadHealthData]);

  const handleTestAll = () => loadHealthData(true);

  const handleBatchSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await MarketplaceHealthService.getInstance().enqueueBatchSync(user.uid);
      await loadHealthData(true);
    } catch (err) {
      console.warn('[MarketplaceHealthDashboard] batch sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Cálculo da Média de Health Score
  const avgHealthScore = healthList.length > 0
    ? Math.round(healthList.reduce((acc, h) => acc + h.healthScore, 0) / healthList.length)
    : 100;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-5 shadow-xl backdrop-blur">
      {/* ── HEADER & SCORE GERAL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white">Torre de Controle Operacional</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono border ${
                avgHealthScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                avgHealthScore >= 50 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                Score: {avgHealthScore}/100
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Diagnóstico de conectividade, latência em ms e execução assíncrona desacoplada via JobQueue.
            </p>
          </div>
        </div>

        {/* Botões Globais / Ações em Lote */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTestAll}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-400' : ''} />
            <span>{isLoading ? 'Testando…' : 'Testar Todos'}</span>
          </button>

          <button
            onClick={handleBatchSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md transition"
          >
            <Zap size={14} />
            <span>{isSyncing ? 'Enfileirando…' : 'Sincronizar Todos (JobQueue)'}</span>
          </button>
        </div>
      </div>

      {/* ── BARRA DE MÉTRICAS OPERACIONAIS (MarketplaceStatistics) ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Anúncios</span>
            <span className="text-lg font-extrabold text-white">{stats.totalListings}</span>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Ativos Publicados</span>
            <span className="text-lg font-extrabold text-emerald-300">{stats.publishedListings}</span>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/30 p-3">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Falhas de Envio</span>
            <span className="text-lg font-extrabold text-rose-300">{stats.failedListings}</span>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Tokens a Expirar</span>
            <span className="text-lg font-extrabold text-amber-300">{stats.expiredTokens}</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pausados / Rascunhos</span>
            <span className="text-lg font-extrabold text-slate-300">{stats.pausedListings + stats.draftListings}</span>
          </div>
        </div>
      )}

      {/* ── CARDS VISUAIS DE SAÚDE POR CANAL ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {availableChannels.map((ch) => {
          const h = healthList.find((item) => item.marketplaceSlug === ch.slug);
          const isOnline = h?.status === 'ONLINE';
          const isWarning = h?.status === 'WARNING';

          return (
            <div
              key={ch.slug}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-3 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-white truncate">{ch.name}</span>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400 animate-pulse' : isWarning ? 'bg-amber-400' : 'bg-rose-500'}`} />
                </div>
                <p className="text-[10px] text-slate-500 uppercase font-mono">{ch.type}</p>

                {/* Status Badges */}
                <div className="mt-2.5 flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono border ${
                    isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    isWarning ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {h?.status || 'OFFLINE'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {h?.latencyMs ? `${h.latencyMs}ms` : '—'}
                  </span>
                </div>
              </div>

              {/* Status do Token */}
              <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 truncate">
                Token: <span className="text-slate-300">{h?.tokenStatus || 'Não testado'}</span>
              </div>

              {/* Ações Rápidas por Canal */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => MarketplaceHealthService.getInstance().checkHealth(user?.uid || '', ch.slug, true).then(() => loadHealthData(false))}
                  className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700 transition"
                >
                  Testar
                </button>
                <button
                  onClick={onOpenCredentials}
                  className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-[10px] font-bold text-blue-300 border border-blue-500/30 transition"
                  title="Configurar Credenciais"
                >
                  <Key size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
