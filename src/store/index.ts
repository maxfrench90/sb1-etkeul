import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthStore, createAuthStore } from './auth.store';
import { UIStore, createUIStore } from './ui.store';
import { BookingStore, createBookingStore } from './booking.store';

export interface RootStore {
  auth: AuthStore;
  ui: UIStore;
  booking: BookingStore;
}

export const useStore = create<RootStore>()(
  persist(
    (set) => ({
      auth: createAuthStore(set),
      ui: createUIStore(set),
      booking: createBookingStore(set)
    }),
    {
      name: 'pet-pathways-store',
      partialize: (state) => ({
        auth: { session: state.auth.session },
        ui: { theme: state.ui.theme }
      })
    }
  )
);