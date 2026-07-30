'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Sparkles, LogOut, Menu as MenuIcon, X } from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';
import { useMenuOrder } from '@/presentation/context/MenuOrderContext';
import { useSidebar } from '@/presentation/context/SidebarContext';

export const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  const { orderedItems } = useMenuOrder();
  const { isMobileOpen, closeMobile } = useSidebar();

  const handleNavClick = () => {
    closeMobile();
  };

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (lg:flex) ─────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex relative flex-col border-r border-slate-800 bg-slate-900/90 backdrop-blur transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white">Mundo LK</span>
                <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">Gestão de Ofertas</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {orderedItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-800 space-y-1.5">
          <Link
            href="/configuracoes/organizar-menu"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
              pathname === '/configuracoes/organizar-menu'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                : 'text-slate-500 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <MenuIcon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Organizar Menu</span>}
          </Link>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sair da Conta</span>}
          </button>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER (lg:hidden) ─────────────────────────────────────────── */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={closeMobile}
          />

          {/* Drawer Content */}
          <aside className="relative flex flex-col w-[80%] max-w-[280px] h-full bg-slate-900 border-r border-slate-800 z-10 shadow-2xl transition-transform duration-300">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
              <Link href="/dashboard" onClick={handleNavClick} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-white">Mundo LK</span>
                  <span className="text-[9px] font-medium text-blue-400 uppercase tracking-wider">Afiliados</span>
                </div>
              </Link>
              <button
                onClick={closeMobile}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
              {orderedItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 space-y-1.5 bg-slate-950/50">
              <Link
                href="/configuracoes/organizar-menu"
                onClick={handleNavClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              >
                <MenuIcon className="h-4 w-4 shrink-0" />
                <span>Organizar Menu</span>
              </Link>

              <button
                onClick={() => {
                  closeMobile();
                  logout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
