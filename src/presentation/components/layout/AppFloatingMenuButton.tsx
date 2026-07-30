'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/presentation/context/SidebarContext';

export const AppFloatingMenuButton: React.FC = () => {
  const { isMobileOpen, toggleMobile } = useSidebar();

  if (isMobileOpen) return null;

  return (
    <button
      onClick={toggleMobile}
      className="lg:hidden fixed bottom-16 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/40 border border-blue-400/30 hover:bg-blue-500 active:scale-95 transition"
      aria-label="Abrir Menu Flutuante"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
};
