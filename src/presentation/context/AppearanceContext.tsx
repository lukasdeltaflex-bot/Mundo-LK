'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';

export interface AppearanceSettings {
  theme: 'dark' | 'light' | 'auto';
  fontFamily: 'Inter' | 'Roboto' | 'Open Sans' | 'Poppins' | 'Montserrat';
  fontSize: 'sm' | 'md' | 'lg';
  primaryColor: string;
  buttonColor: string;
  accentColor: string;
}

const defaultSettings: AppearanceSettings = {
  theme: 'dark',
  fontFamily: 'Inter',
  fontSize: 'md',
  primaryColor: '#2563eb',
  buttonColor: '#3b82f6',
  accentColor: '#10b981',
};

interface AppearanceContextType {
  settings: AppearanceSettings;
  updateSettings: (newSettings: Partial<AppearanceSettings>) => Promise<void>;
  isLoading: boolean;
}

const AppearanceContext = createContext<AppearanceContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
  isLoading: false,
});

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load from Firebase on User Login
  useEffect(() => {
    async function loadUserSettings() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'user_settings', user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data() as AppearanceSettings;
          setSettings({ ...defaultSettings, ...data });
        }
      } catch (err) {
        console.warn('Erro ao carregar configurações de aparência:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserSettings();
  }, [user]);

  // Apply settings to DOM
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

    // 3. Set Font Family on root
    root.style.setProperty('--font-sans', `'${settings.fontFamily}', sans-serif`);
    document.body.style.fontFamily = `'${settings.fontFamily}', sans-serif`;

    // 4. Set Font Scale
    if (settings.fontSize === 'sm') {
      root.style.fontSize = '13px';
    } else if (settings.fontSize === 'lg') {
      root.style.fontSize = '16px';
    } else {
      root.style.fontSize = '14px';
    }

    // 5. CSS Custom Variables for Colors
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--button-color', settings.buttonColor);
    root.style.setProperty('--accent-color', settings.accentColor);
  }, [settings]);

  const updateSettings = async (newSettings: Partial<AppearanceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    if (user) {
      try {
        const docRef = doc(db, 'user_settings', user.uid);
        await setDoc(docRef, { ...updated, userId: user.uid, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.error('Erro ao salvar no Firebase:', err);
      }
    }
  };

  return (
    <AppearanceContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => useContext(AppearanceContext);
