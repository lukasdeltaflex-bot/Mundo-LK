'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Database, Download, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { FirestoreProductRepository } from '@/infrastructure/firebase/repositories/firestore-product.repository';
import { FirestoreOfferRepository } from '@/infrastructure/firebase/repositories/firestore-offer.repository';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';

export interface UIBackupLog {
  id: string;
  type: string;
  format: string;
  size: string;
  date: string;
  status: string;
}

export default function BackupPage() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<UIBackupLog[]>([]);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadBackupLogs() {
      if (!user) return;
      try {
        const q = query(collection(db, 'backup_logs'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list: UIBackupLog[] = snap.docs.map((d) => d.data() as UIBackupLog);
        setBackups(list);
      } catch (err) {
        console.warn('Erro ao carregar logs de backup:', err);
      }
    }
    loadBackupLogs();
  }, [user]);

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const uid = user?.uid || 'guest';
      const prodRepo = new FirestoreProductRepository();
      const offerRepo = new FirestoreOfferRepository();

      const products = await prodRepo.findAll(uid);
      const offers = await offerRepo.findByUserId(uid);

      const backupData = {
        app: 'Mundo LK',
        version: '4.0',
        exportedAt: new Date().toISOString(),
        userId: uid,
        products,
        offers,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const sizeKB = (blob.size / 1024).toFixed(1);

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `mundo_lk_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      const newLog: UIBackupLog = {
        id: `bck_${Date.now()}`,
        type: 'COMPLETO',
        format: 'JSON',
        size: `${sizeKB} KB`,
        date: new Date().toLocaleString('pt-BR'),
        status: 'SUCESSO',
      };

      setBackups([newLog, ...backups]);

      if (user) {
        await setDoc(doc(db, 'backup_logs', newLog.id), { ...newLog, userId: uid });
      }

      setSuccessMsg('Backup exportado e baixado com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao exportar backup:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (parsed.app !== 'Mundo LK' || !parsed.products) {
        alert('Arquivo de backup inválido.');
        return;
      }

      const uid = user?.uid || 'guest';
      const prodRepo = new FirestoreProductRepository();

      for (const prod of parsed.products) {
        await prodRepo.save({ ...prod, userId: uid });
      }

      setSuccessMsg(`Backup importado com sucesso! ${parsed.products.length} produtos restaurados.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert('Erro ao importar arquivo de backup.');
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-400" />
          <span>Backup Manager & Restauração Real</span>
        </h1>
        <p className="text-sm text-slate-400">Exportação completa e restauração dos seus produtos e ofertas reais em JSON.</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card className="p-5">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base text-white">Exportar Dados Reais</CardTitle>
            <CardDescription className="text-xs">Gere arquivos de backup JSON completos do seu catálogo</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <Button
              size="sm"
              variant="primary"
              className="w-full text-xs"
              disabled={exporting}
              leftIcon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              onClick={handleExportJSON}
            >
              {exporting ? 'Gerando Backup...' : 'Exportar Backup JSON Completo'}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card className="p-5">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base text-white">Restaurar Backup</CardTitle>
            <CardDescription className="text-xs">Importe um arquivo JSON salvo anteriormente</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImportJSON}
              className="hidden"
            />
            <Button
              size="sm"
              variant="secondary"
              className="w-full text-xs"
              disabled={importing}
              leftIcon={importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              {importing ? 'Restaurando...' : 'Selecionar Arquivo JSON para Restaurar'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup Logs */}
      <Card className="p-6 border-slate-800 bg-slate-900/90">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-base text-white">Histórico de Backups Gerados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {backups.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Nenhum backup gerado ainda. Clique no botão acima para exportar.</p>
          ) : (
            <div className="space-y-2">
              {backups.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <Badge variant="info">{b.type}</Badge>
                    <span className="text-slate-200 font-semibold">{b.format} ({b.size})</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{b.date}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
