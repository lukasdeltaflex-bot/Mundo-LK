'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  /** The last committed (saved) settings — applied globally to the whole app */
  settings: AppearanceSettings;
  /**
   * Commit a settings patch: persists to localStorage + Firestore and applies
   * it globally to the DOM. Call this ONLY when the user explicitly saves.
   */
  commitSettings: (patch: Partial<AppearanceSettings>) => Promise<void>;
  resetToDefault: () => Promise<void>;
  isLoading: boolean;
}

const AppearanceContext = createContext<AppearanceContextType>({
  settings: defaultSettings,
  commitSettings: async () => {},
  resetToDefault: async () => {},
  isLoading: false,
});

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function applyToDom(s: AppearanceSettings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Theme
  if (s.theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  // Primary color
  root.style.setProperty('--primary-color', s.primaryColor);
  root.style.setProperty('--primary-color-10', s.primaryColor + '1A');

  // Font
  if (s.fontFamily === 'Arial') {
    document.body.style.fontFamily = 'Arial, Helvetica, sans-serif';
    root.style.setProperty('--font-sans', 'Arial, Helvetica, sans-serif');
  } else {
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
  // Track whether Firebase was already loaded for this session (avoid repeat reads)
  const loadedRef = useRef(false);

  // Step 1 — Instant hydration from localStorage (no flash on reload, no Firebase round-trip)
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
      // ignore corrupt cache
    }
  }, []);

  // Step 2 — One-time Firestore sync after login (source of truth, only runs once per session)
  useEffect(() => {
    if (!user || loadedRef.current) {
      if (!user) setIsLoading(false);
      return;
    }

    async function loadFromFirestore() {
      try {
        const ref = doc(db, FIRESTORE_COLLECTION, user!.uid);
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
        console.warn('[AppearanceContext] Firestore load error:', err);
      } finally {
        setIsLoading(false);
        loadedRef.current = true;
      }
    }

    loadFromFirestore();
  }, [user]);

  // ─── commitSettings: the ONLY function that writes globally ───────────────
  const commitSettings = useCallback(
    async (patch: Partial<AppearanceSettings>): Promise<void> => {
      const updated = { ...settings, ...patch };

      // 1. Update React state (triggers global re-render with new settings)
      setSettings(updated);

      // 2. Apply to DOM immediately after commit
      applyToDom(updated);

      // 3. Persist to localStorage (instant, offline-capable)
      localStorage.setItem(LS_KEY, JSON.stringify(updated));

      // 4. Persist to Firestore (async, best-effort)
      if (user) {
        try {
          const ref = doc(db, FIRESTORE_COLLECTION, user.uid);
          await setDoc(
            ref,
            {
              theme: updated.theme,
              fontFamily: updated.fontFamily,
              primaryColor: updated.primaryColor,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.error('[AppearanceContext] Firestore save error:', err);
        }
      }
    },
    [settings, user]
  );

  const resetToDefault = useCallback(async (): Promise<void> => {
    await commitSettings(defaultSettings);
  }, [commitSettings]);

  return (
    <AppearanceContext.Provider value={{ settings, commitSettings, resetToDefault, isLoading }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => useContext(AppearanceContext);

// Backward-compat alias
export const defaultFullSettings = defaultSettings;
// Backward-compat alias for old `updateSettings` callers (maps to commitSettings)
export { AppearanceContext };
