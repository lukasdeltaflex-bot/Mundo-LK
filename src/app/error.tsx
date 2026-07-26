'use client';

import React, { useEffect } from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalErrorPage]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Ocorreu um erro inesperado</h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        O sistema capturou uma exceção sem interrupção catastrófica. Você pode tentar reiniciar a página.
      </p>
      <Button
        onClick={() => reset()}
        variant="primary"
        leftIcon={<RefreshCw className="h-4 w-4" />}
      >
        Tentar Novamente
      </Button>
    </div>
  );
}
