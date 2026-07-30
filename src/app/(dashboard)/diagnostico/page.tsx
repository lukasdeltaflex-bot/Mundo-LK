'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity, ShieldCheck, AlertTriangle, XCircle, RefreshCw, Copy,
  Download, Printer, Check, Wrench, Clock, Database, Server,
  Cpu, ShoppingBag, Eye, HelpCircle, Layers, Zap
} from 'lucide-react';
import {
  SystemDiagnosticService,
  FullDiagnosticReport,
  DiagnosticItem,
  DiagnosticStatus,
} from '@/core/domain/services/SystemDiagnosticService';
import { Button } from '@/presentation/components/ui/Button';

export default function DiagnosticCenterPage() {
  const [report, setReport] = useState<FullDiagnosticReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedTxt, setCopiedTxt] = useState<boolean>(false);
  const [repairingId, setRepairingId] = useState<string | null>(null);

  const diagService = SystemDiagnosticService.getInstance();

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const res = await diagService.runFullDiagnostic();
      setReport(res);
    } catch (err) {
      console.error('[DiagnosticCenterPage] Error running diagnostic:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  const handleCopyTxtReport = async () => {
    if (!report) return;
    const txt = diagService.generateSanitisedTxtReport(report);
    await navigator.clipboard.writeText(txt);
    setCopiedTxt(true);
    setTimeout(() => setCopiedTxt(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `diagnostico_mundo_lk_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleAutoRepair = async (itemId: string) => {
    setRepairingId(itemId);
    try {
      await diagService.repairProblem(itemId);
      await runDiagnostic();
    } finally {
      setRepairingId(null);
    }
  };

  const getStatusBadge = (status: DiagnosticStatus) => {
    switch (status) {
      case 'OK':
        return <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-400 flex items-center gap-1">🟢 Funcionando</span>;
      case 'WARNING':
        return <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-400 flex items-center gap-1">🟡 Atenção</span>;
      case 'ERROR':
        return <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[11px] font-bold text-rose-400 flex items-center gap-1">🔴 Erro Detectado</span>;
      case 'UNCONFIGURED':
      default:
        return <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-400 flex items-center gap-1">⚪ Não Configurado</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-400" />
            Central de Diagnóstico Inteligente
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoramento preventivo e contínuo da infraestrutura, Firestore, APIs de Marketplaces e IA Real.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={runDiagnostic}
            disabled={loading}
            leftIcon={<RefreshCw className={`h-4 w-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />}
            className="border-slate-800 text-slate-200 hover:bg-slate-900 text-xs py-2"
          >
            Executar Novamente
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyTxtReport}
            leftIcon={copiedTxt ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-purple-400" />}
            className="border-slate-800 text-purple-300 hover:bg-purple-500/10 text-xs py-2"
          >
            {copiedTxt ? 'Copiado!' : 'Copiar TXT'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadJson}
            leftIcon={<Download className="h-4 w-4 text-emerald-400" />}
            className="border-slate-800 text-emerald-300 hover:bg-emerald-500/10 text-xs py-2"
          >
            Baixar JSON
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintPdf}
            leftIcon={<Printer className="h-4 w-4 text-amber-400" />}
            className="border-slate-800 text-amber-300 hover:bg-amber-500/10 text-xs py-2"
          >
            PDF / Imprimir
          </Button>
        </div>
      </div>

      {report && (
        <>
          {/* ─── PAINEL SUPERIOR: HEALTH SCORE DETALHADO POR MÓDULO ─────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Score Global */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col items-center justify-center text-center shadow-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saúde Geral do Sistema</span>
              <div className="text-4xl font-extrabold text-white mt-2 flex items-baseline gap-1">
                <span className={report.overallScore >= 90 ? 'text-emerald-400' : report.overallScore >= 70 ? 'text-amber-400' : 'text-rose-400'}>
                  {report.overallScore}%
                </span>
              </div>
              <span className="mt-2 text-xs font-semibold text-slate-400">
                {report.totalChecks} Verificações • {report.okCount} OK • {report.errorCount} Erros
              </span>
            </div>

            {/* Barras de Score por Módulo */}
            <div className="md:col-span-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3 shadow-xl">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-400" /> Detalhamento do Health Score por Módulo
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                {report.moduleScores.map((m) => (
                  <div key={m.moduleName} className="space-y-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{m.moduleName}</span>
                      <span className="font-extrabold text-emerald-400">{m.score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          m.score >= 90 ? 'bg-emerald-500' : m.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${m.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── PAINEL DE MÉTRICAS OPERACIONAIS DE PRODUÇÃO ──────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Último Backup</span>
              <span className="font-bold text-white mt-0.5 block">{report.operationalMetrics.lastBackup}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Sincronização Marketplaces</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">{report.operationalMetrics.lastMarketplaceSync}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Latência Média da IA</span>
              <span className="font-bold text-purple-400 mt-0.5 block">{report.operationalMetrics.avgAiLatencyMs} ms</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Erros (Últimas 24h)</span>
              <span className="font-bold text-slate-300 mt-0.5 block">{report.operationalMetrics.errorsLast24h} evento(s)</span>
            </div>
          </div>

          {/* ─── LISTA DE CARDS DE DIAGNÓSTICO COM SUGESTÕES INTELIGENTES ───────── */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Resultados Detalhados da Auditoria
            </h3>

            <div className="space-y-3">
              {report.items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3 shadow-lg">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">{item.title}</span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400 uppercase">
                          {item.module}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      {item.isAutoFixable && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAutoRepair(item.id)}
                          disabled={repairingId === item.id}
                          leftIcon={<Wrench className={`h-3.5 w-3.5 text-blue-400 ${repairingId === item.id ? 'animate-spin' : ''}`} />}
                          className="text-xs py-1 border-blue-500/20 text-blue-300 hover:bg-blue-600/10"
                        >
                          Corrigir Auto
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Sugestão Inteligente de Correção quando há Erro ou Aviso */}
                  {(item.errorMessage || item.solutionSuggestion) && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5 text-xs text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400">
                        <Zap className="h-3.5 w-3.5" /> Sugestão Inteligente de Correção:
                      </div>
                      {item.errorMessage && (
                        <div>
                          <strong className="text-amber-300">Erro: </strong> {item.errorMessage}
                        </div>
                      )}
                      {item.probableCause && (
                        <div>
                          <strong className="text-amber-300">Causa Provável: </strong> {item.probableCause}
                        </div>
                      )}
                      {item.solutionSuggestion && (
                        <div>
                          <strong className="text-amber-300">Solução Recomendada: </strong> {item.solutionSuggestion}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ─── LINHA DO TEMPO DOS ERROS (ERROR TIMELINE) ────────────────────── */}
          {report.timeline && report.timeline.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" /> Linha do Tempo dos Erros e Eventos
              </h3>

              <div className="space-y-2">
                {report.timeline.map((t) => (
                  <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 text-[11px]">{t.timestamp}</span>
                      <span className="font-bold text-white">{t.title}</span>
                      <span className="text-[10px] text-slate-400">({t.details})</span>
                    </div>
                    <span className="rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
