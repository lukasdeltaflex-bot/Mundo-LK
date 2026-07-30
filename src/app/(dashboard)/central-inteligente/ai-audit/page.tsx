'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Brain, Activity, ShieldCheck, Zap, ArrowLeft, RefreshCcw,
  Sparkles, CheckCircle2, AlertTriangle, Layers, Cpu, Server, Lock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { AIAuditLoggerService, type AIAuditMetrics } from '@/core/domain/services/AIAuditLoggerService';

export default function AIAuditDashboardPage() {
  const [metrics, setMetrics] = useState<AIAuditMetrics>({
    totalCalls: 0,
    successCount: 0,
    errorCount: 0,
    cacheHits: 0,
    avgDurationMs: 0,
    totalTokens: 0,
    savedTokensByCache: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    const data = await AIAuditLoggerService.getMetricsSummary();
    setMetrics(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <Link href="/central-inteligente" className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 mb-2 transition">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Central Inteligente
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
              <Brain className="h-7 w-7 text-purple-400" />
              Painel de Auditoria de Consumo de IA (Google Gemini)
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Rastreamento em tempo real de chamadas, latência, tokens consumidos, economia via Cache e métricas de execução Server-Side.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={fetchMetrics}
            disabled={loading}
            className="text-xs font-bold flex items-center gap-2"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar Métricas
          </Button>
        </div>
      </div>

      {/* Grid de KPIs Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total de Chamadas</span>
            <Server className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{metrics.totalCalls}</div>
          <p className="text-[11px] text-slate-400 mt-1">Requisições registradas no Gemini API</p>
        </Card>

        <Card className="p-5 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Tempo Médio de Resposta</span>
            <Activity className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">{metrics.avgDurationMs} ms</div>
          <p className="text-[11px] text-slate-400 mt-1">Latência média Server-Side</p>
        </Card>

        <Card className="p-5 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Economia via Cache L1/L2</span>
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-400 mt-2">{metrics.savedTokensByCache} tokens</div>
          <p className="text-[11px] text-slate-400 mt-1">{metrics.cacheHits} chamadas economizadas</p>
        </Card>

        <Card className="p-5 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Taxa de Sucesso Operacional</span>
            <ShieldCheck className="h-5 w-5 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-teal-400 mt-2">
            {metrics.totalCalls > 0 ? Math.round((metrics.successCount / metrics.totalCalls) * 100) : 100}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{metrics.successCount} com sucesso / {metrics.errorCount} falhas</p>
        </Card>
      </div>

      {/* Diretrizes do Modelo & Segurança */}
      <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-extrabold text-white">Segurança & Política de Credenciais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-emerald-400" /> Server-Side Only</div>
            <p className="text-slate-400">A chave <code className="text-amber-300">GEMINI_API_KEY</code> reside exclusivamente no servidor backend (0 exposição ao cliente).</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-400" /> Modelo Gemini 2.5 Flash</div>
            <p className="text-slate-400">Execuções reais via endpoint oficial <code className="text-blue-300">v1beta/models/gemini-2.5-flash</code>.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-purple-400" /> Zero Mocks Policy</div>
            <p className="text-slate-400">Diretriz permanente que proíbe templates fixos, mocks ou simulações de inteligência.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
