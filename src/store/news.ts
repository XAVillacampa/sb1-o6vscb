import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NewsNotification } from '../types';

interface NewsState {
  notifications: NewsNotification[];
  addNotification: (notification: NewsNotification) => void;
  updateNotification: (notification: NewsNotification) => void;
  deleteNotification: (id: string) => void;
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set) => ({
      notifications: [],
      
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),
      
      updateNotification: (notification) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notification.id ? { ...notification, updatedAt: new Date() } : n
          ),
        })),
      
      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'news-storage',
      onRehydrateStorage: () => (state) => {
        // Convert date strings back to Date objects
        if (state?.notifications) {
          state.notifications = state.notifications.map(notification => ({
            ...notification,
            createdAt: new Date(notification.createdAt),
            updatedAt: new Date(notification.updatedAt)
          }));
        }
      },
    }
  )
);