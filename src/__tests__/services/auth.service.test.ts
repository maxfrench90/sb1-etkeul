import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('signs in user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result?.user).toEqual(mockUser);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('handles sign in errors', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValueOnce(error);

      await expect(authService.signIn({
        email: 'test@example.com',
        password: 'wrong'
      })).rejects.toThrow('Invalid credentials');

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'auth.signIn',
          error: error.message
        })
      );
    });
  });

  describe('signUp', () => {
    it('signs up user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        role: 'client',
        fullName: 'Test User'
      });

      expect(result?.user).toEqual(mockUser);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            role: 'client',
            full_name: 'Test User'
          }
        }
      });
    });

    it('handles sign up errors', async () => {
      const error = new Error('Email already exists');
      vi.mocked(supabase.auth.signUp).mockRejectedValueOnce(error);

      await expect(authService.signUp({
        email: 'existing@example.com',
        password: 'password123',
        role: 'client'
      })).rejects.toThrow('Email already exists');

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'auth.signUp',
          error: error.message
        })
      );
    });
  });
});