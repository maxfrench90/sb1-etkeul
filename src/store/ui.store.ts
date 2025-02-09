import { StateCreator } from 'zustand';

export interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
  }>;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
}

export const createUIStore: StateCreator<UIStore> = (set) => ({
  theme: 'light',
  sidebarOpen: false,
  toasts: [],

  setTheme: (theme) => {
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  addToast: (type, message) => set((state) => ({
    toasts: [
      ...state.toasts,
      { id: Date.now().toString(), type, message }
    ]
  })),

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((toast) => toast.id !== id)
  }))
});