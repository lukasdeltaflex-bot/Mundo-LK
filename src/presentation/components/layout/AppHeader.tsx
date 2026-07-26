'use client';

import React, { useState } from 'react';
import { Bell, Search, User as UserIcon, LogOut, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { Badge } from '../ui/Badge';

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-72">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar ofertas, produtos..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-4">
        <Badge variant="info" className="hidden sm:flex gap-1 py-1 text-[11px]">
          <Sparkles className="h-3 w-3 text-blue-400" />
          <span>Mundo LK v4.0 Pro</span>
        </Badge>

        <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500" />
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-white">{user?.name || 'Afiliado'}</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email || 'afiliado@mundolk.com'}</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Meu Perfil</span>
              </button>
              <button
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Configurações</span>
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sair da Conta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
