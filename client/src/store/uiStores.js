import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },
  setAll: (list) => {
    set({ 
      notifications: list,
      unreadCount: list.filter(n => !n.isRead).length
    });
  },
  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  }
}));

export const useProjectStore = create((set) => ({
  currentProject: null,
  contributions: [],
  pis: 0,
  setProject: (project) => set({ currentProject: project }),
  setContributions: (contributions) => set({ contributions }),
  addContribution: (block) => set((state) => ({ contributions: [...state.contributions, block] })),
  updateScore: (pis) => set({ pis })
}));
