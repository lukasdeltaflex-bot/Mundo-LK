'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell, Search, User as UserIcon, LogOut, Settings, Sparkles,
  CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, ShoppingBag, Cpu,
  Loader2, Menu as MenuIcon, X,
} from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { useNotifications, type NotificationType } from '@/presentation/context/NotificationContext';
import { useSidebar } from '@/presentation/context/SidebarContext';
import { Badge } from '../ui/Badge';
import { AutoCheckHeaderBadge } from './AutoCheckHeaderBadge';

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

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const { toggleMobile } = useSidebar();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-3 sm:px-6 flex items-center justify-between gap-2 z-20">
      {/* Mobile Hamburger & Brand */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMobile}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white"
          aria-label="Abrir Menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-extrabold text-white hidden sm:inline">Mundo LK</span>
        </Link>
      </div>

      {/* Search Input (Desktop & Mobile Expandable) */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar ofertas, produtos..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <AutoCheckHeaderBadge />

        <Badge variant="info" className="hidden md:flex gap-1 py-1 text-[11px]">
          <Sparkles className="h-3 w-3 text-blue-400" />
          <span>Mundo LK v4.0 Pro</span>
        </Badge>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notif-bell-btn"
            onClick={handleNotifOpen}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-24px)] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span>Marcar lidas</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
                {isLoading ? (
                  <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    <span>Carregando notificações...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Nenhuma notificação por enquanto.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif.id, notif.lida)}
                      className={`p-3 text-xs transition cursor-pointer hover:bg-slate-800/40 flex items-start gap-2.5 ${
                        !notif.lida ? 'bg-blue-600/5' : ''
                      }`}
                    >
                      {typeIcon(notif.tipo)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`font-bold truncate ${!notif.lida ? 'text-white' : 'text-slate-300'}`}>
                            {notif.titulo}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {formatDate(notif.dataCriacao ? new Date(notif.dataCriacao) : new Date())}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{notif.mensagem}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 space-y-1">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Afiliado Mundo LK'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <Link
                href="/perfil"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium"
              >
                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                <span>Meu Perfil</span>
              </Link>

              <Link
                href="/configuracoes"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                <span>Configurações</span>
              </Link>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition font-medium border-t border-slate-800 pt-2"
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
