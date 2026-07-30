'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlugZap, BarChart3, ShoppingBag, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
  { id: 'operacao',    label: 'Operação',    href: '/operacao',    icon: PlugZap        },
  { id: 'analytics',   label: 'Analytics',   href: '/analytics',   icon: BarChart3      },
  { id: 'produtos',    label: 'Produtos',    href: '/produtos',    icon: ShoppingBag    },
  { id: 'configuracoes', label: 'Ajustes',   href: '/configuracoes', icon: Settings      },
];

export const AppBottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-2 py-1 flex items-center justify-around shadow-2xl safe-area-pb">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition ${
              isActive
                ? 'text-blue-400 font-bold bg-blue-600/10 border border-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-blue-400 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
