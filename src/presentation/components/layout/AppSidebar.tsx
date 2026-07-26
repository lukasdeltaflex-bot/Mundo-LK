'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  BrainCircuit,
  FolderTree,
  Store,
  Terminal,
  Zap,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Produtos', href: '/produtos', icon: ShoppingBag },
    { name: 'Ofertas', href: '/ofertas', icon: Tag },
    { name: 'Inteligência', href: '/inteligencia', icon: BrainCircuit },
    { name: 'Categorias', href: '/categorias', icon: FolderTree },
    { name: 'Plataformas', href: '/plataformas', icon: Store },
    { name: 'Prompts', href: '/prompts', icon: Terminal },
    { name: 'Automações', href: '/automacoes', icon: Zap },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-950 p-4 flex flex-col justify-between hidden md:flex min-h-screen">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">AffiliateOS</h1>
            <span className="text-[10px] uppercase font-semibold text-blue-400 tracking-wider">V4 Personal</span>
          </div>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all',
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-blue-400' : 'text-slate-500')} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-900 pt-4 px-3">
        <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Status: Operacional</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">1-Clique IA Ativada</p>
        </div>
      </div>
    </aside>
  );
};
