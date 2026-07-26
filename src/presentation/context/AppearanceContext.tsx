'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';

export interface AppearancePreferences {
  theme: 'dark' | 'light' | 'auto';
  fontFamily: 'Inter' | 'Roboto' | 'Poppins' | 'Montserrat' | 'Nunito' | 'Open Sans';
  fontSize: 'Compacto' | 'Normal' | 'Grande';
  fontWeight: 'Leve' | 'Normal' | 'Semibold' | 'Negrito';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  buttonColor?: string;
  sidebarMode: 'Expandido' | 'Compacto';
  cardStyle: 'Arredondado' | 'Moderado' | 'Quadrado';
  spacing: 'Compacto' | 'Normal' | 'Confortável';
  animations: boolean;
}

export const defaultPreferences: AppearancePreferences = {
  theme: 'dark',
  fontFamily: 'Inter',
  fontSize: 'Normal',
  fontWeight: 'Normal',
  primaryColor: '#2563EB',
  secondaryColor: '#1E40AF',
  accentColor: '#10B981',
  buttonColor: '#3B82F6',
  sidebarMode: 'Expandido',
  cardStyle: 'Moderado',
  spacing: 'Normal',
  animations: true,
};

interface AppearanceContextType {
  settings: AppearancePreferences;
  updateSettings: (newSettings: Partial<AppearancePreferences>) => Promise<void>;
  resetToDefault: () => Promise<void>;
  isLoading: boolean;
}

const AppearanceContext = createContext<AppearanceContextType>({
  settings: defaultPreferences,
  updateSettings: async () => {},
  resetToDefault: async () => {},
  isLoading: false,
});

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppearancePreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load from Firebase Firestore collection `user_preferences`
  useEffect(() => {
    async function loadUserPreferences() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'user_preferences', user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data() as AppearancePreferences;
          setSettings({ ...defaultPreferences, ...data });
        }
      } catch (err) {
        console.warn('Erro ao carregar preferências de aparência:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserPreferences();
  }, [user]);

  // Apply all preferences to DOM dynamically
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // 1. Theme application
    if (settings.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else if (settings.theme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.remove('light');
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }

    // 2. Load Google Fonts dynamically
    const fontName = settings.fontFamily.replace(/\s+/g, '+');
    const linkId = 'google-font-dynamic';
    let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;

    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = linkId;
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);
    }
    linkEl.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@300;400;500;600;700&display=swap`;

    // 3. Apply Font Family & Weight to root & body
    root.style.setProperty('--font-sans', `'${settings.fontFamily}', sans-serif`);
    document.body.style.fontFamily = `'${settings.fontFamily}', sans-serif`;

    let weightVal = '400';
    if (settings.fontWeight === 'Leve') weightVal = '300';
    if (settings.fontWeight === 'Semibold') weightVal = '600';
    if (settings.fontWeight === 'Negrito') weightVal = '700';
    document.body.style.fontWeight = weightVal;

    // 4. Apply Font Scale
    if (settings.fontSize === 'Compacto') {
      root.style.fontSize = '13px';
    } else if (settings.fontSize === 'Grande') {
      root.style.fontSize = '16px';
    } else {
      root.style.fontSize = '14px';
    }

    // 5. Card Border Radius
    let radius = '1rem';
    if (settings.cardStyle === 'Arredondado') radius = '1.5rem';
    if (settings.cardStyle === 'Quadrado') radius = '0.25rem';
    root.style.setProperty('--card-radius', radius);

    // 6. CSS Colors
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    root.style.setProperty('--accent-color', settings.accentColor);
  }, [settings]);

  const updateSettings = async (newSettings: Partial<AppearancePreferences>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (user) {
      try {
        const docRef = doc(db, 'user_preferences', user.uid);
        await setDoc(
          docRef,
          { ...updated, userId: user.uid, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        console.error('Erro ao salvar user_preferences no Firebase:', err);
      }
    }
  };

  const resetToDefault = async () => {
    await updateSettings(defaultPreferences);
  };

  return (
    <AppearanceContext.Provider value={{ settings, updateSettings, resetToDefault, isLoading }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => useContext(AppearanceContext);
