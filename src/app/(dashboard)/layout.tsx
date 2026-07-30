import React from 'react';
import { AppSidebar } from '@/presentation/components/layout/AppSidebar';
import { AppHeader } from '@/presentation/components/layout/AppHeader';
import { QueryProvider } from '@/presentation/providers/QueryProvider';
import { ProtectedRoute } from '@/presentation/components/auth/ProtectedRoute';
import { SidebarProvider } from '@/presentation/context/SidebarContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <ProtectedRoute>
        <SidebarProvider>
          <div className="min-h-screen flex bg-slate-950 text-slate-100 max-w-full overflow-x-hidden">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
              <AppHeader />
              <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto max-w-full">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </ProtectedRoute>
    </QueryProvider>
  );
}
