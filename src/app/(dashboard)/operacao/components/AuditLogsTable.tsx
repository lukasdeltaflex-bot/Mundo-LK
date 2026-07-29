'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, RefreshCw, Terminal, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { FirestoreAuditLogRepository } from '@/infrastructure/firebase/repositories/firestore-audit-log.repository';
import { AuditLog } from '@/core/domain/entities/audit-log.entity';
import { useAuth } from '@/presentation/context/AuthContext';
import { Button } from '@/presentation/components/ui/Button';

export type LogSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export const AuditLogsTable: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('TODOS');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('TODOS');

  const repo = new FirestoreAuditLogRepository();

  const loadLogs = async () => {
    setLoading(true);
    try {
      const activeUid = user?.uid || 'guest';
      const list = await repo.findByUserId(activeUid);
      setLogs(list);
    } catch (err) {
      console.warn('[AuditLogsTable] Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [user]);

  const filteredLogs = logs.filter((log) => {
    if (selectedModule !== 'TODOS' && log.module !== selectedModule) return false;
    
    // Check severity from metadata or action
    const severity = (log.metadata?.severity as LogSeverity) || (log.action.includes('ERROR') ? 'ERROR' : 'INFO');
    if (selectedSeverity !== 'TODOS' && severity !== selectedSeverity) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchModule = log.module.toLowerCase().includes(q);
      const matchId = log.id.toLowerCase().includes(q);
      const matchTrace = (log.metadata?.traceId as string)?.toLowerCase().includes(q);
      return matchAction || matchModule || matchId || matchTrace;
    }
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 md:p-5 shadow-xl backdrop-blur space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Terminal className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Central de Logs de Auditoria & Tráfego Operacional
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                {filteredLogs.length} Eventos Registrados
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Trilha imutável em tempo real com rastreabilidade total por <code className="text-purple-300">traceId</code>.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadLogs}
          leftIcon={<RefreshCw className={`h-3.5 w-3.5 text-purple-400 ${loading ? 'animate-spin' : ''}`} />}
          className="text-xs shrink-0 border-purple-500/20 text-purple-300 hover:bg-purple-500/10"
        >
          Atualizar Logs
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por traceId, ação, ID..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-purple-500 focus:outline-none"
          >
            <option value="TODOS">Todos os Módulos</option>
            <option value="OFFER_MANAGEMENT">Ofertas</option>
            <option value="integrations">Integrações</option>
            <option value="AI_CORE">IA Core</option>
            <option value="AUTHENTICATION">Autenticação</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-purple-500 focus:outline-none"
          >
            <option value="TODOS">Todas as Severidades</option>
            <option value="INFO">🟢 INFO</option>
            <option value="WARNING">🟡 WARNING</option>
            <option value="ERROR">🔴 ERROR</option>
            <option value="CRITICAL">🚨 CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Horário</th>
              <th className="py-2.5 px-3">Severidade</th>
              <th className="py-2.5 px-3">Módulo / Ação</th>
              <th className="py-2.5 px-3">Trace ID</th>
              <th className="py-2.5 px-3">Entidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900 text-slate-300">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                  Nenhum evento de auditoria encontrado.
                </td>
              </tr>
            ) : (
              filteredLogs.slice(0, 30).map((log) => {
                const severity = (log.metadata?.severity as LogSeverity) || (log.action.includes('ERROR') ? 'ERROR' : 'INFO');
                const traceId = (log.metadata?.traceId as string) || log.id.slice(0, 16);

                let BadgeIcon = Info;
                let badgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

                if (severity === 'WARNING') {
                  BadgeIcon = AlertTriangle;
                  badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                } else if (severity === 'ERROR' || severity === 'CRITICAL') {
                  BadgeIcon = AlertCircle;
                  badgeClass = 'bg-red-500/10 text-red-400 border-red-500/20';
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold border ${badgeClass}`}>
                        <BadgeIcon className="h-3 w-3" />
                        {severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      <span className="text-slate-400 font-normal">{log.module} / </span>
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-purple-300">
                      {traceId}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[150px]">
                      {log.entity} ({log.entityId})
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
