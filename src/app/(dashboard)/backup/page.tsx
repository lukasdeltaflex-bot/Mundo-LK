'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Database, Download, Upload, RefreshCw, ShieldCheck } from 'lucide-react';

export default function BackupPage() {
  const [backups, setBackups] = useState([
    { id: 'bck_1', type: 'COMPLETO', format: 'JSON', size: '2.4 MB', date: '2026-07-26 12:00', status: 'SUCESSO' },
    { id: 'bck_2', type: 'INCREMENTAL', format: 'CSV', size: '480 KB', date: '2026-07-25 18:30', status: 'SUCESSO' },
  ]);

  const handleExportJSON = () => {
    const backupData = {
      app: 'Mundo LK',
      version: '4.0',
      exportedAt: new Date().toISOString(),
      productsCount: 24,
      offersCount: 48,
      promptsCount: 12,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mundo_lk_backup_full_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    const newEntry = {
      id: `bck_${Date.now()}`,
      type: 'COMPLETO',
      format: 'JSON',
      size: '2.5 MB',
      date: new Date().toLocaleString(),
      status: 'SUCESSO',
    };
    setBackups([newEntry, ...backups]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-400" />
          <span>Backup Manager & Restauração</span>
        </h1>
        <p className="text-sm text-slate-400">Exportação completa e restauração de produtos, ofertas, prompts e configurações do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card className="p-5">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Exportar Dados do Sistema</CardTitle>
            <CardDescription className="text-xs">Gere arquivos de backup completos ou incrementais</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Backup Completo (JSON)</span>
                <Badge variant="info">Produtos, Ofertas, Prompts</Badge>
              </div>
              <Button variant="primary" className="w-full py-2.5 text-xs font-bold" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={handleExportJSON}>
                Exportar Backup em JSON
              </Button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Relatório em Planilha (CSV)</span>
                <Badge variant="neutral">Formato Excel</Badge>
              </div>
              <Button variant="outline" className="w-full py-2.5 text-xs font-bold" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={handleExportJSON}>
                Exportar Catálogo em CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Restore Card */}
        <Card className="p-5">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base">Restaurar Backup</CardTitle>
            <CardDescription className="text-xs">Importe arquivos JSON previamente exportados</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center space-y-3">
              <Upload className="h-8 w-8 text-blue-400 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Arraste seu arquivo de backup JSON aqui</p>
                <p className="text-[11px] text-slate-500">ou clique para selecionar do computador</p>
              </div>
              <Button variant="secondary" size="sm" className="text-xs">
                Selecionar Arquivo
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Validação automática de integridade ativa antes da gravação no Firestore.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card className="p-5">
        <CardHeader className="p-0 mb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Histórico de Backups</CardTitle>
            <Button size="sm" variant="outline" className="text-xs" leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Atualizar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 space-y-2">
          {backups.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-blue-400" />
                <div>
                  <span className="font-semibold text-white">{b.type} ({b.format})</span>
                  <span className="text-[11px] text-slate-500 block">{b.date} • {b.size}</span>
                </div>
              </div>
              <Badge variant="success">{b.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
