'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { Layers, Play, Pause, XCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { BatchImportService, BatchItem } from '@/infrastructure/queue/batch-import.service';

import { ImportEngine } from '../operacao/services/ImportEngine';
import { useAuth } from '@/presentation/context/AuthContext';

export default function LotePage() {
  const { user } = useAuth();
  const [urlsInput, setUrlsInput] = useState('');
  const [queue, setQueue] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const batchService = BatchImportService.getInstance();

  const handleStartBatch = async () => {
    const urls = urlsInput.split('\n').filter((u) => u.trim());
    if (urls.length === 0) return;

    const items = batchService.createBatch(urls);
    setQueue(items);
    setIsProcessing(true);
    setIsPaused(false);

    if (!user?.uid) return;
    const activeUid = user.uid;

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'PROCESSING', progress: 30 } : i))
      );

      try {
        const result = await new ImportEngine().resolveProduct(item.url);
        if (result && result.data) {
          setQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'COMPLETED',
                    progress: 100,
                    productTitle: result.data.title,
                  }
                : i
            )
          );
        } else {
          setQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'FAILED',
                    progress: 100,
                    error: result.reviewReason || 'Falha ao extrair dados do produto',
                  }
                : i
            )
          );
        }
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: 'FAILED',
                  progress: 100,
                  error: err?.message || 'Erro de processamento',
                }
              : i
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const completedCount = queue.filter((i) => i.status === 'COMPLETED').length;
  const progressPercent = queue.length > 0 ? Math.round((completedCount / queue.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Layers className="h-6 w-6 text-blue-400" />
          <span>Importação em Lote (Até 100 URLs Simultâneas)</span>
        </h1>
        <p className="text-sm text-slate-400">Cole múltiplas URLs de produtos para cadastro e geração de ofertas em massa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-5">
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-base">Inserir URLs em Lote</CardTitle>
            <CardDescription className="text-xs">Uma URL por linha (máximo 100)</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <textarea
              rows={10}
              value={urlsInput}
              onChange={(e) => setUrlsInput(e.target.value)}
              placeholder="https://shopee.com.br/product/123&#10;https://mercadolivre.com.br/MLB-456&#10;https://amazon.com.br/dp/789"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <Button
              variant="primary"
              className="w-full py-2.5 text-xs font-bold"
              disabled={isProcessing || !urlsInput.trim()}
              leftIcon={<Play className="h-3.5 w-3.5" />}
              onClick={handleStartBatch}
            >
              Iniciar Importação em Lote
            </Button>
          </CardContent>
        </Card>

        {/* Progress & Queue List */}
        <Card className="lg:col-span-2 p-5">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Fila de Processamento</CardTitle>
                <CardDescription className="text-xs">
                  {queue.length} URLs registradas • {completedCount} concluídas
                </CardDescription>
              </div>

              {isProcessing && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-400" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="text-xs"
                    onClick={() => {
                      setIsProcessing(false);
                      setQueue([]);
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Overall Progress Bar */}
            {queue.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Progresso Geral</span>
                  <span className="text-blue-400">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0 max-h-[360px] overflow-y-auto space-y-2">
            {queue.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nenhum lote em execução. Insira as URLs ao lado para iniciar.
              </div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {item.status === 'COMPLETED' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
                    {item.status === 'FAILED' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
                    {item.status === 'PROCESSING' && <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />}
                    {item.status === 'PENDING' && <div className="h-2 w-2 rounded-full bg-slate-600 shrink-0" />}

                    <span className="font-mono text-slate-300 truncate max-w-[280px]">
                      {item.productTitle || item.url}
                    </span>
                  </div>

                  <div>
                    {item.status === 'COMPLETED' && <Badge variant="success">Concluído</Badge>}
                    {item.status === 'FAILED' && <Badge variant="danger">{item.error || 'Erro'}</Badge>}
                    {item.status === 'PROCESSING' && <Badge variant="info">Processando</Badge>}
                    {item.status === 'PENDING' && <Badge variant="neutral">Pendente</Badge>}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
