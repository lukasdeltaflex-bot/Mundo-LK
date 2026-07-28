'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/presentation/context/AuthContext';
import { FirestoreCampaignRepository } from '@/infrastructure/firebase/repositories/firestore-campaign.repository';
import { CampaignAnalyticsService } from '@/core/application/services/CampaignAnalyticsService';
import { CampaignOptimizationService, OptimizationReport, CampaignRecommendation } from '@/core/application/services/CampaignOptimizationService';
import { Campaign } from '@/core/domain/entities/campaign.entity';
import { CampaignROI } from '@/core/domain/value-objects/CampaignROI';
import {
  TrendingUp,
  MousePointerClick,
  Share2,
  ShoppingCart,
  DollarSign,
  BarChart3,
  RefreshCw,
  Zap,
  Award,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

// ── Tipos locais ────────────────────────────────────────────────────────────
interface KPISummary {
  totalRevenue: number;
  totalCommission: number;
  totalClicks: number;
  totalShares: number;
  totalConversions: number;
  avgCTR: number;
  avgConversionRate: number;
  avgROI: number;
}

interface MarketplaceStat {
  slug: string;
  campaigns: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function computeSummary(campaigns: Campaign[]): KPISummary {
  if (campaigns.length === 0) {
    return {
      totalRevenue: 0, totalCommission: 0, totalClicks: 0,
      totalShares: 0, totalConversions: 0, avgCTR: 0,
      avgConversionRate: 0, avgROI: 0,
    };
  }
  const totalRevenue = campaigns.reduce((s, c) => s + c.financial.revenue, 0);
  const totalCommission = campaigns.reduce((s, c) => s + c.financial.commission, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.metrics.clicks, 0);
  const totalShares = campaigns.reduce((s, c) => s + c.metrics.shares, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.metrics.conversions, 0);
  const avgCTR = campaigns.reduce((s, c) => s + c.metrics.ctr, 0) / campaigns.length;
  const avgConversionRate = campaigns.reduce((s, c) => s + c.metrics.conversionRate, 0) / campaigns.length;
  const avgROI = campaigns.reduce((s, c) => s + CampaignROI.calculate(c.financial.revenue, c.financial.cost), 0) / campaigns.length;
  return {
    totalRevenue, totalCommission, totalClicks, totalShares,
    totalConversions, avgCTR, avgConversionRate, avgROI,
  };
}

function groupByMarketplace(campaigns: Campaign[]): MarketplaceStat[] {
  const map = new Map<string, MarketplaceStat>();
  for (const c of campaigns) {
    const slug = c.marketplaceSlug || 'outros';
    const existing = map.get(slug) || { slug, campaigns: 0, clicks: 0, conversions: 0, revenue: 0 };
    existing.campaigns += 1;
    existing.clicks += c.metrics.clicks;
    existing.conversions += c.metrics.conversions;
    existing.revenue += c.financial.revenue;
    map.set(slug, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
}

// ── Componente KPI Card ──────────────────────────────────────────────────────
function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  gradient: string;
}) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 ${gradient} border border-white/10 shadow-lg`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70 font-medium">{label}</span>
        <div className="p-2 bg-white/10 rounded-xl">
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      {sub && <p className="text-xs text-white/50">{sub}</p>}
    </div>
  );
}

// ── Barra de progresso simples ────────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [report, setReport] = useState<OptimizationReport | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const repo = new FirestoreCampaignRepository();
      const result = await repo.findPagedByUserId(user.uid, 100);
      setCampaigns(result.items);
      const optimization = CampaignOptimizationService.getInstance().analyze(result.items);
      setReport(optimization);
    } catch (err) {
      console.warn('[AnalyticsPage] load error:', err);
    } finally {
      setIsLoading(false);
      setLastRefreshed(new Date());
    }
  }, [user]);

  useEffect(() => {
    // Inicia listeners do analytics service
    CampaignAnalyticsService.getInstance().initListeners();
    load();
  }, [load]);

  const summary = computeSummary(campaigns);
  const byMarketplace = groupByMarketplace(campaigns);
  const topCampaigns = [...campaigns].sort((a, b) => b.metrics.clicks - a.metrics.clicks).slice(0, 5);
  const maxClicks = topCampaigns[0]?.metrics.clicks || 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg">
              <BarChart3 size={22} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Inteligência Comercial
            </h1>
          </div>
          <p className="text-slate-400 text-sm ml-1">
            Análise em tempo real das suas campanhas de afiliados
          </p>
        </div>
        <button
          onClick={load}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-slate-300 transition-all"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {/* ── Estado Vazio ── */}
      {!isLoading && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700">
            <Zap size={40} className="text-violet-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-200">Nenhuma campanha ainda</h2>
          <p className="text-slate-400 text-sm max-w-sm text-center">
            Crie sua primeira campanha na{' '}
            <a href="/operacao" className="text-violet-400 hover:underline">
              Central de Marketplaces
            </a>{' '}
            para começar a medir resultados.
          </p>
        </div>
      )}

      {/* ── KPIs ── */}
      {campaigns.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              icon={DollarSign}
              label="Receita Total"
              value={formatCurrency(summary.totalRevenue)}
              sub={`Comissão: ${formatCurrency(summary.totalCommission)}`}
              gradient="bg-gradient-to-br from-emerald-600/80 to-teal-700/80"
            />
            <KPICard
              icon={MousePointerClick}
              label="Cliques Totais"
              value={summary.totalClicks.toLocaleString('pt-BR')}
              sub={`CTR médio: ${summary.avgCTR.toFixed(1)}%`}
              gradient="bg-gradient-to-br from-blue-600/80 to-indigo-700/80"
            />
            <KPICard
              icon={ShoppingCart}
              label="Conversões"
              value={summary.totalConversions.toLocaleString('pt-BR')}
              sub={`Taxa: ${summary.avgConversionRate.toFixed(1)}%`}
              gradient="bg-gradient-to-br from-violet-600/80 to-purple-700/80"
            />
            <KPICard
              icon={TrendingUp}
              label="ROI Médio"
              value={`${summary.avgROI.toFixed(0)}%`}
              sub={`${campaigns.length} campanha${campaigns.length !== 1 ? 's' : ''} ativa${campaigns.length !== 1 ? 's' : ''}`}
              gradient="bg-gradient-to-br from-orange-600/80 to-rose-700/80"
            />
          </div>

          {/* ── Compartilhamentos ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 flex items-center gap-4">
              <div className="p-3 bg-sky-500/20 rounded-xl">
                <Share2 size={20} className="text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Compartilhamentos</p>
                <p className="text-xl font-bold text-white">{summary.totalShares.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 flex items-center gap-4">
              <div className="p-3 bg-violet-500/20 rounded-xl">
                <Target size={20} className="text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Conv. / Clique</p>
                <p className="text-xl font-bold text-white">{summary.avgConversionRate.toFixed(2)}%</p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <Award size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Lucro Líquido</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(campaigns.reduce((s, c) => s + c.financial.profit, 0))}
                </p>
              </div>
            </div>
          </div>

          {/* ── Rankings ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Top campanhas por cliques */}
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <MousePointerClick size={16} className="text-blue-400" />
                Top Campanhas por Cliques
              </h2>
              <div className="space-y-3">
                {topCampaigns.map((c, idx) => (
                  <div key={c.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 truncate max-w-[60%]">
                        <span className="text-slate-500 mr-1.5">#{idx + 1}</span>
                        {c.name}
                      </span>
                      <span className="text-blue-400 font-medium">{c.metrics.clicks.toLocaleString('pt-BR')} cliques</span>
                    </div>
                    <ProgressBar value={c.metrics.clicks} max={maxClicks} color="bg-blue-500" />
                  </div>
                ))}
                {topCampaigns.length === 0 && (
                  <p className="text-slate-500 text-sm">Nenhum dado ainda.</p>
                )}
              </div>
            </div>

            {/* Performance por marketplace */}
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <BarChart3 size={16} className="text-violet-400" />
                Performance por Marketplace
              </h2>
              <div className="space-y-3">
                {byMarketplace.map((m) => (
                  <div key={m.slug} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/40">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-violet-300 uppercase">
                        {m.slug.slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 capitalize">{m.slug}</p>
                      <p className="text-xs text-slate-400">
                        {m.campaigns} campanha{m.campaigns !== 1 ? 's' : ''} · {m.conversions} conv.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-emerald-400">{formatCurrency(m.revenue)}</p>
                      <p className="text-xs text-slate-500">{m.clicks.toLocaleString('pt-BR')} cliques</p>
                    </div>
                  </div>
                ))}
                {byMarketplace.length === 0 && (
                  <p className="text-slate-500 text-sm">Nenhum dado ainda.</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Recomendações IA ── */}
          {report && report.recommendations.length > 0 && (
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Lightbulb size={16} className="text-yellow-400" />
                  Recomendações de Otimização
                </h2>
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded-lg">
                  {report.recommendations.length} insight{report.recommendations.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Resumo executivo */}
              {report.summary && (
                <p className="text-sm text-slate-300 bg-slate-700/50 rounded-xl p-3 leading-relaxed">
                  {report.summary}
                </p>
              )}

              {/* Lista de recomendações */}
              <div className="space-y-3">
                {report.recommendations.slice(0, 8).map((rec, idx) => (
                  <div
                    key={`${rec.campaignId}-${idx}`}
                    className={`rounded-xl p-4 border ${
                      rec.priority === 'HIGH'
                        ? 'border-rose-500/30 bg-rose-500/10'
                        : rec.priority === 'MEDIUM'
                        ? 'border-amber-500/30 bg-amber-500/10'
                        : 'border-slate-600/50 bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {rec.priority === 'HIGH' ? (
                          <AlertTriangle size={16} className="text-rose-400" />
                        ) : rec.priority === 'MEDIUM' ? (
                          <Info size={16} className="text-amber-400" />
                        ) : (
                          <CheckCircle2 size={16} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              rec.priority === 'HIGH'
                                ? 'bg-rose-500/20 text-rose-300'
                                : rec.priority === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-600/50 text-slate-400'
                            }`}
                          >
                            {rec.priority}
                          </span>
                          <span className="text-xs text-slate-400 truncate">{rec.campaignName}</span>
                        </div>
                        <p className="text-sm text-slate-200 mb-1">{rec.insight}</p>
                        <p className="text-xs text-slate-400">→ {rec.action}</p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">{rec.metric}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Rodapé ── */}
          <p className="text-center text-xs text-slate-600">
            Última atualização: {lastRefreshed.toLocaleTimeString('pt-BR')} ·{' '}
            {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} carregada{campaigns.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  );
}
