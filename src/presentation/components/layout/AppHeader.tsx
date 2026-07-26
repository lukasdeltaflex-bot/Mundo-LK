'use client';

import React from 'react';
import { Search, Bell, User } from 'lucide-react';
import { Input } from '../ui/Input';

export const AppHeader: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
      <div className="w-72">
        <Input
          placeholder="Pesquisar ofertas ou produtos..."
          leftIcon={<Search className="h-4 w-4" />}
          className="h-9 bg-slate-900/90 border-slate-800 text-xs"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-500" />
        </button>

        <div className="flex items-center gap-2.5 border-l border-slate-800 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-white leading-none">Afiliado Admin</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Assistente Pessoal</span>
          </div>
        </div>
      </div>
    </header>
  );
};
