import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthStore } from '../../store/auth.store';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('AuthStore', () => {
  const mockSet = vi.fn();
  let store: ReturnType<typeof createAuthStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createAuthStore(mockSet);
  });

  describe('signIn', () => {
    it('handles successful sign in', async () => {
      const mockSession = { user: { id: '123' } };
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null
      });

      await store.signIn('test@example.com', 'password');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          session: mockSession
        })
      );
      expect(errorMonitor.logSuccess).toHaveBeenCalled();
    });

    it('handles sign in errors', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValueOnce(error);

      await expect(
        store.signIn('test@example.com', 'wrong')
      ).rejects.toThrow('Invalid credentials');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          error: error.message
        })
      );
      expect(errorMonitor.logError).toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('handles successful sign out', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
        error: null
      });

      await store.signOut();

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          session: null
        })
      );
    });

    it('handles sign out errors', async () => {
      const error = new Error('Sign out failed');
      vi.mocked(supabase.auth.signOut).mockRejectedValueOnce(error);

      await expect(store.signOut()).rejects.toThrow('Sign out failed');

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          error: error.message
        })
      );
    });
  });
});