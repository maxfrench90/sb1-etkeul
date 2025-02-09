import { StateCreator } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { errorMonitor } from '../lib/monitoring';

export interface AuthStore {
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
  clearError: () => void;
}

export const createAuthStore: StateCreator<AuthStore> = (set) => ({
  session: null,
  loading: false,
  error: null,

  setSession: (session) => set({ session }),
  
  clearError: () => set({ error: null }),

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      set({ session: data.session });

      await errorMonitor.logSuccess({
        operation: 'auth.signIn',
        attempts: 1,
        duration: 0,
        context: { email }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      set({ error: message });

      await errorMonitor.logError({
        operation: 'auth.signIn',
        error: message,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { email }
      });

      throw err;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ session: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  }
});