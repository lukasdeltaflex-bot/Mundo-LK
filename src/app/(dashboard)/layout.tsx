import React from 'react';
import { AppSidebar } from '@/presentation/components/layout/AppSidebar';
import { AppHeader } from '@/presentation/components/layout/AppHeader';
import { QueryProvider } from '@/presentation/providers/QueryProvider';
import { ProtectedRoute } from '@/presentation/components/auth/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <ProtectedRoute>
        <div className="min-h-screen flex bg-slate-950 text-slate-100">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <AppHeader />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
          </div>
        </div>
      </ProtectedRoute>
    </QueryProvider>
  );
}
