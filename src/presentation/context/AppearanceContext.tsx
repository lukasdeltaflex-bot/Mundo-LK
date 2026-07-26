'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemeOption = 'dark' | 'light';
export type FontOption = 'Inter' | 'Roboto' | 'Poppins' | 'Arial';

export interface AppearanceSettings {
  theme: ThemeOption;
  fontFamily: FontOption;
  primaryColor: string;
}

export const defaultSettings: AppearanceSettings = {
  theme: 'dark',
  fontFamily: 'Inter',
  primaryColor: '#2563EB',
};

const LS_KEY = 'mundo_lk_appearance_prefs';
const FIRESTORE_COLLECTION = 'user_preferences';

// ─── Context Interface ────────────────────────────────────────────────────────

interface AppearanceContextType {
  settings: AppearanceSettings;
  updateSettings: (patch: Partial<AppearanceSettings>) => Promise<void>;
  resetToDefault: () => Promise<void>;
  isLoading: boolean;
}

const AppearanceContext = createContext<AppearanceContextType>({
  settings: defaultSettings,
  updateSettings: async () => {},
  resetToDefault: async () => {},
  isLoading: false,
});

// ─── Helper: apply settings to DOM ───────────────────────────────────────────

function applyToDom(s: AppearanceSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // ── Theme (dark / light) ──────────────────────────────────────────────────
  if (s.theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  // ── Primary Color → CSS variable ─────────────────────────────────────────
  root.style.setProperty('--primary-color', s.primaryColor);

  // Derive a lighter tint for hover states (opacity trick via alpha channel)
  root.style.setProperty('--primary-color-10', s.primaryColor + '1A'); // ~10% opacity

  // ── Font ──────────────────────────────────────────────────────────────────
  if (s.fontFamily === 'Arial') {
    // Arial is system font — remove any loaded Google Font
    document.body.style.fontFamily = 'Arial, Helvetica, sans-serif';
    root.style.setProperty('--font-sans', 'Arial, Helvetica, sans-serif');
  } else {
    // Load Google Font dynamically
    const fontSlug = s.fontFamily.replace(/\s+/g, '+');
    const linkId = 'google-font-dynamic';
    let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = linkId;
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);
    }
    linkEl.href = `https://fonts.googleapis.com/css2?family=${fontSlug}:wght@300;400;500;600;700&display=swap`;
    document.body.style.fontFamily = `'${s.fontFamily}', sans-serif`;
    root.style.setProperty('--font-sans', `'${s.fontFamily}', sans-serif`);
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppearanceSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Step 1 — Instant hydration from localStorage (prevents flash on reload)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as Partial<AppearanceSettings>;
        const merged = { ...defaultSettings, ...parsed };
        setSettings(merged);
        applyToDom(merged);
      }
    } catch {
      // ignore
    }
  }, []);

  // Step 2 — Sync from Firestore after login (source of truth)
  useEffect(() => {
    async function load() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        const ref = doc(db, FIRESTORE_COLLECTION, user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const remote: AppearanceSettings = {
            theme: data.theme ?? defaultSettings.theme,
            fontFamily: data.fontFamily ?? defaultSettings.fontFamily,
            primaryColor: data.primaryColor ?? defaultSettings.primaryColor,
          };
          setSettings(remote);
          applyToDom(remote);
          localStorage.setItem(LS_KEY, JSON.stringify(remote));
        }
      } catch (err) {
        console.warn('[AppearanceContext] Erro ao carregar Firestore:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  // Step 3 — Re-apply whenever settings change (e.g. live preview while user picks)
  useEffect(() => {
    applyToDom(settings);
  }, [settings]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const updateSettings = async (patch: Partial<AppearanceSettings>): Promise<void> => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));

    if (user) {
      const ref = doc(db, FIRESTORE_COLLECTION, user.uid);
      await setDoc(
        ref,
        { theme: updated.theme, fontFamily: updated.fontFamily, primaryColor: updated.primaryColor, updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }
  };

  const resetToDefault = async (): Promise<void> => {
    await updateSettings(defaultSettings);
  };

  return (
    <AppearanceContext.Provider value={{ settings, updateSettings, resetToDefault, isLoading }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => useContext(AppearanceContext);

// Keep a named export for backward-compat if anything imports defaultFullSettings
export const defaultFullSettings = defaultSettings;
