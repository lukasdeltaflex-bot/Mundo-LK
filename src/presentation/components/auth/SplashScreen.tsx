import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-100 z-50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 mb-6 animate-pulse">
        <Sparkles className="h-8 w-8 text-white" />
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">Mundo LK</h1>
      <p className="text-xs text-blue-400 font-medium tracking-wide mb-8 uppercase">Gestão Inteligente de Ofertas</p>

      <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <span>Carregando ambiente seguro...</span>
      </div>
    </div>
  );
};
