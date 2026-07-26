import React from 'react';
import Link from 'next/link';
import { Button } from '@/presentation/components/ui/Button';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">404 — Página Não Encontrada</h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        A rota solicitada não existe ou foi movida.
      </p>
      <Link href="/dashboard">
        <Button variant="primary" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Voltar ao Dashboard
        </Button>
      </Link>
    </div>
  );
}
