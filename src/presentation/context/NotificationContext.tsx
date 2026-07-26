'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, writeBatch, Timestamp, addDoc,
} from 'firebase/firestore';
import { db } from '@/infrastructure/firebase/config/firebase.config';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'product'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  titulo: string;
  mensagem: string;
  tipo: NotificationType;
  dataCriacao: Date;
  lida: boolean;
}

// ─── Context Interface ────────────────────────────────────────────────────────

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  isLoading: true,
});

// ─── Provider ────────────────────────────────────────────────────────────────

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    // Real-time listener: fetch last 30 notifications for this user
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('dataCriacao', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: AppNotification[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            titulo: data.titulo ?? 'Notificação',
            mensagem: data.mensagem ?? '',
            tipo: (data.tipo as NotificationType) ?? 'info',
            dataCriacao:
              data.dataCriacao instanceof Timestamp
                ? data.dataCriacao.toDate()
                : new Date(data.dataCriacao ?? Date.now()),
            lida: data.lida ?? false,
          };
        });
        setNotifications(items);
        setIsLoading(false);
      },
      (err) => {
        console.warn('[NotificationContext] onSnapshot error:', err);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const markAsRead = async (id: string) => {
    const ref = doc(db, 'notifications', id);
    await updateDoc(ref, { lida: true });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.lida);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, 'notifications', n.id), { lida: true });
    });
    await batch.commit();
  };

  const unreadCount = notifications.filter((n) => !n.lida).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, isLoading }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

// ─── Utility: create a notification programmatically ─────────────────────────

export async function createNotification(
  userId: string,
  data: Omit<AppNotification, 'id' | 'userId' | 'dataCriacao' | 'lida'>
) {
  await addDoc(collection(db, 'notifications'), {
    userId,
    titulo: data.titulo,
    mensagem: data.mensagem,
    tipo: data.tipo,
    dataCriacao: Timestamp.now(),
    lida: false,
  });
}
