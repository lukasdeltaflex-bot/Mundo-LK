'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/core/domain/entities/user.entity';
import { FirebaseAuthService } from '@/infrastructure/firebase/auth/firebase-auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (name: string, email: string, pass: string) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const authService = new FirebaseAuthService();

  useEffect(() => {
    console.log('[AUTH] initializeAuth context mount');

    const unsubscribe = authService.subscribeToAuthChanges((u) => {
      console.log('[AUTH] onAuthStateChanged evento recebido:', {
        hasUser: !!u,
        uid: u?.uid || 'null',
        email: u?.email || 'N/A',
      });

      // Firebase Auth é a ÚNICA fonte de verdade da identidade do usuário
      setUser(u);
      setLoading(false);
      console.log('[AUTH] loading atualizado: false | currentUser:', u?.uid || 'null');
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(email, pass);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<User> => {
    setLoading(true);
    try {
      const registeredUser = await authService.register(name, email, pass);
      setUser(registeredUser);
      return registeredUser;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    await authService.resetPassword(email);
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mundo_lk_user');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
