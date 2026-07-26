'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, Search, User as UserIcon, LogOut, Settings, Sparkles,
  CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, ShoppingBag, Cpu,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { useNotifications, type NotificationType } from '@/presentation/context/NotificationContext';
import { Badge } from '../ui/Badge';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function typeIcon(tipo: NotificationType) {
  const cls = 'h-3.5 w-3.5 shrink-0';
  switch (tipo) {
    case 'success':  return <CheckCircle2 className={`${cls} text-emerald-400`} />;
    case 'warning':  return <AlertTriangle className={`${cls} text-amber-400`} />;
    case 'error':    return <XCircle className={`${cls} text-red-400`} />;
    case 'product':  return <ShoppingBag className={`${cls} text-blue-400`} />;
    case 'system':   return <Cpu className={`${cls} text-purple-400`} />;
    default:         return <Info className={`${cls} text-slate-400`} />;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close panels when clicking outside
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNotifOpen = () => {
    setNotifOpen((prev) => !prev);
    setDropdownOpen(false);
  };

  const handleNotifClick = async (id: string, lida: boolean) => {
    if (!lida) await markAsRead(id);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between">

      {/* Search */}
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

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <Badge variant="info" className="hidden sm:flex gap-1 py-1 text-[11px]">
          <Sparkles className="h-3 w-3 text-blue-400" />
          <span>Mundo LK v4.0 Pro</span>
        </Badge>

        {/* ── Bell / Notification Panel ─────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-bell-btn"
            onClick={handleNotifOpen}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 transition font-medium"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar todas
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500">
                    <Bell className="h-8 w-8 text-slate-700" />
                    <span className="text-xs">Nenhuma notificação ainda</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n.id, n.lida)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-800/50 transition ${
                        !n.lida ? 'bg-blue-600/5' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className="mt-0.5">{typeIcon(n.tipo)}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${n.lida ? 'text-slate-300' : 'text-white'}`}>
                          {n.titulo}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.mensagem}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{formatDate(n.dataCriacao)}</p>
                      </div>

                      {/* Unread dot */}
                      {!n.lida && (
                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/80">
                  <p className="text-[10px] text-slate-500 text-center">
                    {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''} · atualiza em tempo real
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── User Dropdown ─────────────────────────────────────────── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-white">{user?.name || 'Afiliado'}</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email || ''}</span>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-white">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <Link
                href="/perfil"
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>Meu Perfil</span>
              </Link>
              <Link
                href="/configuracoes"
                onClick={() => setDropdownOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Configurações</span>
              </Link>
              <button
                onClick={() => { setDropdownOpen(false); logout(); }}
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
