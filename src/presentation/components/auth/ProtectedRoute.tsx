'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/presentation/context/AuthContext';
import { SplashScreen } from './SplashScreen';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log(`[AUTH] ProtectedRoute check: loading=${loading}, user=${user?.uid || 'null'}`);
    if (!loading && !user) {
      console.log('[AUTH] ProtectedRoute: Redirecionando para /login (não autenticado e loading finalizado)');
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <SplashScreen />;
  }

  return <>{children}</>;
};
