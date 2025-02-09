import { describe, it, expect, vi } from 'vitest';
import { 
  rateLimiter,
  sanitizeInput,
  validatePassword,
  validateSession,
  validateRequest,
  logSecurityEvent
} from '../../lib/security';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('Security Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('limits auth attempts correctly', () => {
      const key = 'test@example.com';
      
      // Make max attempts
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isRateLimited(key, 'auth')).toBe(false);
        rateLimiter.addAttempt(key, 'auth');
      }

      // Should be rate limited now
      expect(rateLimiter.isRateLimited(key, 'auth')).toBe(true);
    });

    it('resets rate limit after window', async () => {
      const key = 'test@example.com';
      rateLimiter.addAttempt(key, 'auth');
      
      // Fast-forward time
      vi.advanceTimersByTime(60 * 1000);
      
      expect(rateLimiter.isRateLimited(key, 'auth')).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('removes dangerous HTML', () => {
      const input = '<script>alert("xss")</script>Hello';
      expect(sanitizeInput(input)).toBe('Hello');
    });

    it('preserves safe text', () => {
      const input = 'Hello, World!';
      expect(sanitizeInput(input)).toBe('Hello, World!');
    });
  });

  describe('Password Validation', () => {
    it('validates strong passwords', () => {
      const result = validatePassword('StrongP@ss123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('catches weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });
  });

  describe('Session Validation', () => {
    it('validates active sessions', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: {
          session: {
            expires_at: new Date(Date.now() + 3600000).toISOString()
          }
        },
        error: null
      });

      const isValid = await validateSession();
      expect(isValid).toBe(true);
    });

    it('handles expired sessions', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null
      });

      const isValid = await validateSession();
      expect(isValid).toBe(false);
    });
  });

  describe('Request Validation', () => {
    it('validates authorized requests', () => {
      const request = new Request('https://api.example.com', {
        headers: {
          'Authorization': 'Bearer token123',
          'X-CSRF-Token': 'csrf123'
        }
      });

      expect(validateRequest(request)).toBe(true);
    });

    it('rejects unauthorized requests', () => {
      const request = new Request('https://api.example.com');
      expect(validateRequest(request)).toBe(false);
    });
  });

  describe('Security Logging', () => {
    it('logs security events', async () => {
      const event = {
        type: 'login_attempt',
        severity: 'medium' as const,
        details: { ip: '127.0.0.1' }
      };

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        insert: vi.fn().mockResolvedValueOnce({ error: null })
      }));

      await logSecurityEvent(event);
      expect(supabase.from).toHaveBeenCalledWith('security_logs');
    });

    it('handles logging errors', async () => {
      const error = new Error('Logging failed');
      vi.mocked(supabase.from).mockImplementationOnce(() => {
        throw error;
      });

      await logSecurityEvent({
        type: 'test',
        severity: 'low',
        details: {}
      });

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'security.logEvent',
          error: error.message
        })
      );
    });
  });
});