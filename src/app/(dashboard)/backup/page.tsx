'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function BackupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/configuracoes?tab=backup');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-32 text-slate-400 text-xs gap-2">
      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      Redirecionando para Backup Manager nas Configurações...
    </div>
  );
}
