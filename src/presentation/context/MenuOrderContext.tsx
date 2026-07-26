'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  BrainCircuit,
  Terminal,
  Layers,
  Calendar,
  Database,
  Palette,
  BarChart3,
  Link as LinkIcon,
  FolderHeart,
  Trash2,
  type LucideIcon,
} from 'lucide-react';

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface MenuItemDefinition {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
}

// Master list: single source of truth for all navigation items
export const ALL_MENU_ITEMS: MenuItemDefinition[] = [
  { id: 'dashboard',  name: 'Dashboard',            href: '/dashboard',               icon: LayoutDashboard },
  { id: 'lote',       name: 'Importação em Lote',   href: '/lote',                    icon: Layers         },
  { id: 'agendamento',name: 'Agendamento',           href: '/agendamento',             icon: Calendar       },
  { id: 'produtos',   name: 'Produtos',              href: '/produtos',                icon: ShoppingBag    },
  { id: 'ofertas',    name: 'Ofertas & Copys',       href: '/ofertas',                 icon: Tag            },
  { id: 'inteligencia',name: 'Smart Intelligence',   href: '/inteligencia',            icon: BrainCircuit   },
  { id: 'prompts',    name: 'Prompts Manager',       href: '/prompts',                 icon: Terminal       },
  { id: 'colecoes',   name: 'Coleções',              href: '/colecoes',                icon: FolderHeart    },
  { id: 'lixeira',    name: 'Lixeira Inteligente',  href: '/lixeira',                 icon: Trash2         },
  { id: 'links',      name: 'Meus Links',            href: '/links',                   icon: LinkIcon       },
  { id: 'operacao',   name: 'Minha Operação',        href: '/operacao',                icon: BarChart3      },
  { id: 'backup',     name: 'Backup Manager',        href: '/backup',                  icon: Database       },
  { id: 'aparencia',  name: 'Aparência',             href: '/configuracoes/aparencia', icon: Palette        },
];

const DEFAULT_ORDER: string[] = ALL_MENU_ITEMS.map((item) => item.id);

const LS_KEY = 'mundo_lk_menu_order';
const FIRESTORE_COLLECTION = 'user_preferences';

// ─── Context Interface ────────────────────────────────────────────────────────

interface MenuOrderContextType {
  /** Items sorted according to the user's saved order */
  orderedItems: MenuItemDefinition[];
  /** Persist a new order (array of IDs) */
  saveOrder: (newOrderIds: string[]) => Promise<void>;
  /** Reset to default order */
  resetOrder: () => Promise<void>;
  isLoading: boolean;
}

const MenuOrderContext = createContext<MenuOrderContextType>({
  orderedItems: ALL_MENU_ITEMS,
  saveOrder: async () => {},
  resetOrder: async () => {},
  isLoading: false,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function applyOrder(orderIds: string[]): MenuItemDefinition[] {
  const map = new Map(ALL_MENU_ITEMS.map((item) => [item.id, item]));
  const sorted: MenuItemDefinition[] = [];

  // Add items in requested order (only existing ids)
  for (const id of orderIds) {
    if (map.has(id)) {
      sorted.push(map.get(id)!);
      map.delete(id);
    }
  }

  // Append any new items not yet in the saved order (graceful future additions)
  for (const item of map.values()) {
    sorted.push(item);
  }

  return sorted;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const MenuOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orderIds, setOrderIds] = useState<string[]>(DEFAULT_ORDER);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Step 1: Hydrate instantly from localStorage (no flash)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) {
        const parsed: string[] = JSON.parse(cached);
        if (Array.isArray(parsed)) setOrderIds(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Step 2: Sync from Firestore (source of truth after login)
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
          if (Array.isArray(data?.menuOrder) && data.menuOrder.length > 0) {
            const remote: string[] = data.menuOrder;
            setOrderIds(remote);
            if (typeof window !== 'undefined') {
              localStorage.setItem(LS_KEY, JSON.stringify(remote));
            }
          }
        }
      } catch (err) {
        console.warn('[MenuOrderContext] Falha ao carregar ordem do Firebase:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  const saveOrder = async (newOrderIds: string[]) => {
    setOrderIds(newOrderIds);

    // LocalStorage for instant persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, JSON.stringify(newOrderIds));
    }

    // Firestore persistence
    if (user) {
      try {
        const ref = doc(db, FIRESTORE_COLLECTION, user.uid);
        await setDoc(ref, { menuOrder: newOrderIds, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.error('[MenuOrderContext] Falha ao salvar ordem no Firebase:', err);
      }
    }
  };

  const resetOrder = async () => {
    await saveOrder(DEFAULT_ORDER);
  };

  const orderedItems = applyOrder(orderIds);

  return (
    <MenuOrderContext.Provider value={{ orderedItems, saveOrder, resetOrder, isLoading }}>
      {children}
    </MenuOrderContext.Provider>
  );
};

export const useMenuOrder = () => useContext(MenuOrderContext);
