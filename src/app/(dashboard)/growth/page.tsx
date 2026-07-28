'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/presentation/context/AuthContext';
import { FirestoreCampaignRepository } from '@/infrastructure/firebase/repositories/firestore-campaign.repository';
import { FirestoreAnalyticsEventRepository } from '@/infrastructure/firebase/repositories/firestore-analytics-event.repository';
import { FirestoreAutomationRuleRepository } from '@/infrastructure/firebase/repositories/firestore-automation-rule.repository';
import { FirestoreJobRepository } from '@/infrastructure/firebase/repositories/firestore-job.repository';
import { GrowthAdvisorService, GrowthAnalysisReport, TimeWindowDays } from '@/core/application/services/GrowthAdvisorService';
import { JobQueueService } from '@/core/application/services/JobQueueService';
import { Campaign } from '@/core/domain/entities/campaign.entity';
import { AutomationRule } from '@/core/domain/entities/automation-rule.entity';
import { Job } from '@/core/domain/entities/job.entity';
import {
  Flame,
  Zap,
  AlertTriangle,
  RefreshCw,
  Play,
  CheckCircle2,
  Clock,
  Settings,
  Sparkles,
  TrendingUp,
  Cpu,
  Layers,
} from 'lucide-react';

export default function GrowthDashboardPage() {
  const { user } = useAuth();
  const [windowDays, setWindowDays] = useState<TimeWindowDays>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorkerRunning, setIsWorkerRunning] = useState(false);
  const [report, setReport] = useState<GrowthAnalysisReport | null>(null);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const campaignRepo = new FirestoreCampaignRepository();
      const analyticsRepo = new FirestoreAnalyticsEventRepository();
      const ruleRepo = new FirestoreAutomationRuleRepository();
      const jobRepo = new FirestoreJobRepository();

      const [campaignRes, eventsRes, rulesRes, jobsRes] = await Promise.all([
        campaignRepo.findPagedByUserId(user.uid, 100),
        analyticsRepo.findPagedByUserId(user.uid, 100),
        ruleRepo.findPagedByUserId(user.uid, 50),
        jobRepo.findPagedByUserId(user.uid, 20),
      ]);

      const analysis = GrowthAdvisorService.getInstance().analyze(
        campaignRes.items,
        eventsRes.items,
        windowDays
      );

      setReport(analysis);
      setRules(rulesRes.items);
      setJobs(jobsRes.items);
    } catch (err) {
      console.warn('[GrowthDashboardPage] loadData error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, windowDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunWorker = async () => {
    if (!user) return;
    setIsWorkerRunning(true);
    try {
      await JobQueueService.getInstance().processPendingJobs(user.uid);
      await loadData();
    } catch (err) {
      console.warn('[GrowthDashboardPage] handleRunWorker error:', err);
    } finally {
      setIsWorkerRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 shadow-lg">
              <Flame size={22} className="text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Inteligência de Crescimento
            </h1>
          </div>
          <p className="text-slate-400 text-sm ml-1">
            Recomendações acionáveis e automações para aumentar suas vendas hoje
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Seletor de janela de tempo */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700 text-xs">
            {([7, 30, 90] as TimeWindowDays[]).map((days) => (
              <button
                key={days}
                onClick={() => setWindowDays(days)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  windowDays === days
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {days} dias
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm text-slate-300 transition-all"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* ── Hero Oportunidade do Dia ── */}
      {report?.heroOpportunity && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-violet-600/20 border border-amber-500/30 p-6 md:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Sparkles size={18} />
              <span>Oportunidade do Dia</span>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Score: {report.heroOpportunity.impactScore}/100
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white">
            {report.heroOpportunity.title}
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
            {report.heroOpportunity.reason}
          </p>

          <div className="pt-2 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-md">
              <Zap size={16} />
              <span>{report.heroOpportunity.action}</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Badging: {report.heroOpportunity.metricBadge}
            </span>
          </div>
        </div>
      )}

      {/* ── Grid Principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Coluna 1 e 2: Oportunidades & Alertas */}
        <div className="lg:col-span-2 space-y-6">

          {/* Oportunidades de Otimização */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              Oportunidades de Escala ({report?.opportunities.length || 0})
            </h3>

            <div className="space-y-3">
              {report?.opportunities.map((opp) => (
                <div key={opp.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100">{opp.title}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      {opp.metricBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{opp.reason}</p>
                  <p className="text-xs text-emerald-400 font-medium">→ {opp.action}</p>
                </div>
              ))}
              {(!report || report.opportunities.length === 0) && (
                <p className="text-sm text-slate-500 py-4">Nenhuma oportunidade de escala no momento.</p>
              )}
            </div>
          </div>

          {/* Alertas Operacionais */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-400" />
              Alertas Operacionais ({report?.alerts.length || 0})
            </h3>

            <div className="space-y-3">
              {report?.alerts.map((alt) => (
                <div key={alt.id} className="p-4 rounded-xl bg-slate-800/50 border border-rose-500/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100">{alt.title}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                      {alt.metricBadge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{alt.reason}</p>
                  <p className="text-xs text-rose-400 font-medium">→ {alt.action}</p>
                </div>
              ))}
              {(!report || report.alerts.length === 0) && (
                <p className="text-sm text-slate-500 py-4">Nenhum alerta operacional ativo.</p>
              )}
            </div>
          </div>

        </div>

        {/* Coluna 3: Regras de Automação & Fila de Jobs */}
        <div className="space-y-6">

          {/* Automações Ativas */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <Settings size={18} className="text-amber-400" />
                Regras de Automação
              </h3>
              <span className="text-xs text-slate-400">{rules.length} cadastradas</span>
            </div>

            <div className="space-y-3">
              {rules.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{r.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {r.trigger.metric} {r.trigger.operator} {r.trigger.value}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    r.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' :
                    r.status === 'TESTING' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
              {rules.length === 0 && (
                <p className="text-xs text-slate-500">Nenhuma regra de automação criada.</p>
              )}
            </div>
          </div>

          {/* Fila de Jobs & Worker */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <Cpu size={18} className="text-violet-400" />
                Worker Assíncrono
              </h3>
              <button
                onClick={handleRunWorker}
                disabled={isWorkerRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all"
              >
                <Play size={12} className={isWorkerRunning ? 'animate-spin' : ''} />
                {isWorkerRunning ? 'Executando…' : 'Rodar Worker'}
              </button>
            </div>

            <div className="space-y-2">
              {jobs.slice(0, 5).map((j) => (
                <div key={j.id} className="p-2.5 rounded-xl bg-slate-800/40 text-xs flex items-center justify-between">
                  <div className="truncate flex-1 pr-2">
                    <p className="font-mono text-slate-300 truncate">{j.type}</p>
                    <p className="text-[10px] text-slate-500 truncate">Key: {j.executionKey}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    j.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                    j.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-300 animate-pulse' :
                    j.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {j.status}
                  </span>
                </div>
              ))}
              {jobs.length === 0 && (
                <p className="text-xs text-slate-500">Nenhum job na fila no momento.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
