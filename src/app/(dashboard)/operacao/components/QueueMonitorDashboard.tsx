'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Clock, CheckCircle2, AlertTriangle, RefreshCw, Play, Pause } from 'lucide-react';
import { JobQueueService } from '@/core/application/services/JobQueueService';
import { Job } from '@/core/domain/entities/job.entity';
import { useAuth } from '@/presentation/context/AuthContext';
import { Button } from '@/presentation/components/ui/Button';

export const QueueMonitorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const queueService = JobQueueService.getInstance();

  const loadQueue = async () => {
    setLoading(true);
    try {
      const activeUid = user?.uid || 'guest';
      const activeJobs = await queueService.getPendingJobs(activeUid);
      setJobs(activeJobs);
    } catch (err) {
      console.warn('[QueueMonitorDashboard] Erro ao carregar fila:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const pendingCount = jobs.filter((j) => j.status === 'PENDING').length;
  const processingCount = jobs.filter((j) => j.status === 'PROCESSING').length;
  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;
  const failedCount = jobs.filter((j) => j.status === 'FAILED').length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:p-5 shadow-xl backdrop-blur space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Scheduler & Job Queue Monitor
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                {jobs.length} Trabalhos Processados
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Monitoramento das filas de sincronização assíncrona e agendamentos de disparo.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadQueue}
          leftIcon={<RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />}
          className="text-xs shrink-0 border-amber-500/20 text-amber-300 hover:bg-amber-500/10"
        >
          Atualizar Fila
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] font-medium text-slate-400">Processando</div>
          <div className="text-lg font-bold text-blue-400">{processingCount}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] font-medium text-slate-400">Aguardando</div>
          <div className="text-lg font-bold text-amber-400">{pendingCount}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] font-medium text-slate-400">Concluídos</div>
          <div className="text-lg font-bold text-emerald-400">{completedCount}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="text-[10px] font-medium text-slate-400">Falhas</div>
          <div className="text-lg font-bold text-red-400">{failedCount}</div>
        </div>
      </div>
    </div>
  );
};
