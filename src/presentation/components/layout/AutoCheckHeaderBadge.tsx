'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { SystemDiagnosticService, DiagnosticStatus, FullDiagnosticReport } from '@/core/domain/services/SystemDiagnosticService';

export const AutoCheckHeaderBadge: React.FC = () => {
  const [report, setReport] = useState<FullDiagnosticReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const diagService = SystemDiagnosticService.getInstance();

  useEffect(() => {
    async function runSilentAutoCheck() {
      try {
        const result = await diagService.runFullDiagnostic();
        setReport(result);
      } catch (err) {
        console.warn('[AutoCheck] Silently failed diagnostic check:', err);
      } finally {
        setLoading(false);
      }
    }

    runSilentAutoCheck();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-semibold">
        <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
        <span>AutoCheck...</span>
      </div>
    );
  }

  if (!report) return null;

  const status = report.overallStatus;

  return (
    <Link
      href="/diagnostico"
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition shadow-sm ${
        status === 'OK'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
          : status === 'WARNING'
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
      }`}
      title="Clique para abrir a Central de Diagnóstico"
    >
      {status === 'OK' && <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />}
      {status === 'WARNING' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
      {status === 'ERROR' && <XCircle className="h-3.5 w-3.5 text-rose-400" />}

      <span>
        {status === 'OK'
          ? 'Sistema Íntegro'
          : status === 'WARNING'
          ? `${report.warningCount} aviso(s)`
          : `${report.errorCount} erro(s) crítico(s)`}
      </span>
    </Link>
  );
};
