'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';

export interface FullAppearanceSettings {
  theme: 'dark' | 'light' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  sidebarBg: string;
  cardBg: string;
  fontFamily: 'Inter' | 'Roboto' | 'Poppins' | 'Montserrat' | 'Nunito' | 'Open Sans';
  fontSize: 'Compacto' | 'Normal' | 'Grande';
  fontWeight: 'Leve' | 'Normal' | 'Semibold' | 'Negrito';
  layoutSpacing: 'Compacto' | 'Normal' | 'Espaçoso';
  cardRadius: 'Quadrado' | 'Moderado' | 'Arredondado';
  cardShadow: 'Nenhuma' | 'Suave' | 'Marcada' | 'Elevada';
  buttonStyle: 'Reto' | 'Arredondado' | 'Pílula';
  sidebarMode: 'Expandido' | 'Compacto';
  animations: boolean;
}

export const defaultFullSettings: FullAppearanceSettings = {
  theme: 'dark',
  primaryColor: '#2563EB',
  secondaryColor: '#1E40AF',
  accentColor: '#10B981',
  sidebarBg: '#0F172A',
  cardBg: '#1E293B',
  fontFamily: 'Inter',
  fontSize: 'Normal',
  fontWeight: 'Normal',
  layoutSpacing: 'Normal',
  cardRadius: 'Moderado',
  cardShadow: 'Marcada',
  buttonStyle: 'Arredondado',
  sidebarMode: 'Expandido',
  animations: true,
};

const LOCAL_STORAGE_KEY = 'mundo_lk_appearance_prefs';

interface AppearanceContextType {
  settings: FullAppearanceSettings;
  updateSettings: (newSettings: Partial<FullAppearanceSettings>) => Promise<void>;
  resetToDefault: () => Promise<void>;
  isLoading: boolean;
}

const AppearanceContext = createContext<AppearanceContextType>({
  settings: defaultFullSettings,
  updateSettings: async () => {},
  resetToDefault: async () => {},
  isLoading: false,
});

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<FullAppearanceSettings>(defaultFullSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Initial Load from LocalStorage fallback for instant UI load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as FullAppearanceSettings;
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.warn('Erro ao carregar cache do localStorage:', e);
      }
    }
  }, []);

  // 2. Sync with Firebase Firestore for user-scoped settings
  useEffect(() => {
    async function loadFirebasePreferences() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'user_preferences', user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const remote = snap.data() as FullAppearanceSettings;
          const merged = { ...defaultFullSettings, ...remote };
          setSettings(merged);

          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar user_preferences do Firestore:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFirebasePreferences();
  }, [user]);

  // 3. Real-time DOM CSS Variables & Classes injection
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Theme (Dark / Light / Auto)
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

    // Google Fonts Loader
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

    // Font Family & Weight
    root.style.setProperty('--font-sans', `'${settings.fontFamily}', sans-serif`);
    document.body.style.fontFamily = `'${settings.fontFamily}', sans-serif`;

    let weightVal = '400';
    if (settings.fontWeight === 'Leve') weightVal = '300';
    if (settings.fontWeight === 'Semibold') weightVal = '600';
    if (settings.fontWeight === 'Negrito') weightVal = '700';
    document.body.style.fontWeight = weightVal;

    // Font Size Scale
    if (settings.fontSize === 'Compacto') {
      root.style.fontSize = '13px';
    } else if (settings.fontSize === 'Grande') {
      root.style.fontSize = '16px';
    } else {
      root.style.fontSize = '14px';
    }

    // CSS Color Variables
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--sidebar-bg', settings.sidebarBg);
    root.style.setProperty('--card-bg', settings.cardBg);

    // Card Radius
    let radius = '0.75rem';
    if (settings.cardRadius === 'Arredondado') radius = '1.5rem';
    if (settings.cardRadius === 'Quadrado') radius = '0.125rem';
    root.style.setProperty('--card-radius', radius);

    // Card Shadow
    let shadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
    if (settings.cardShadow === 'Nenhuma') shadow = 'none';
    if (settings.cardShadow === 'Suave') shadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
    if (settings.cardShadow === 'Elevada') shadow = '0 25px 50px -12px rgba(0,0,0,0.5)';
    root.style.setProperty('--card-shadow', shadow);

    // Button Radius
    let btnRadius = '0.5rem';
    if (settings.buttonStyle === 'Reto') btnRadius = '0.125rem';
    if (settings.buttonStyle === 'Pílula') btnRadius = '9999px';
    root.style.setProperty('--btn-radius', btnRadius);

    // Layout Spacing
    let layoutPadding = '1.5rem';
    if (settings.layoutSpacing === 'Compacto') layoutPadding = '0.75rem';
    if (settings.layoutSpacing === 'Espaçoso') layoutPadding = '2.5rem';
    root.style.setProperty('--layout-padding', layoutPadding);
  }, [settings]);

  const updateSettings = async (newSettings: Partial<FullAppearanceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Immediate LocalStorage save
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }

    // Firebase save
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
    await updateSettings(defaultFullSettings);
  };

  return (
    <AppearanceContext.Provider value={{ settings, updateSettings, resetToDefault, isLoading }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => useContext(AppearanceContext);
