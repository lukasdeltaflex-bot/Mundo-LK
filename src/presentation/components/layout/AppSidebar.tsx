'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  BrainCircuit,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Layers,
  Calendar,
  Database,
  Palette,
  BarChart3,
  Link as LinkIcon,
  FolderHeart,
} from 'lucide-react';
import { useAuth } from '@/presentation/context/AuthContext';

export const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Importação em Lote', href: '/lote', icon: Layers },
    { name: 'Agendamento', href: '/agendamento', icon: Calendar },
    { name: 'Produtos', href: '/produtos', icon: ShoppingBag },
    { name: 'Ofertas & Copys', href: '/ofertas', icon: Tag },
    { name: 'Smart Intelligence', href: '/inteligencia', icon: BrainCircuit },
    { name: 'Prompts Manager', href: '/prompts', icon: Terminal },
    { name: 'Coleções', href: '/colecoes', icon: FolderHeart },
    { name: 'Meus Links', href: '/links', icon: LinkIcon },
    { name: 'Minha Operação', href: '/operacao', icon: BarChart3 },
    { name: 'Backup Manager', href: '/backup', icon: Database },
    { name: 'Aparência', href: '/configuracoes/aparencia', icon: Palette },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800 bg-slate-900/90 backdrop-blur transition-all duration-300 ${
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
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
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
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair da Conta</span>}
        </button>
      </div>
    </aside>
  );
};
