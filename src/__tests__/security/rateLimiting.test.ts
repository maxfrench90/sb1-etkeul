import { describe, it, expect, vi } from 'vitest';
import { rateLimiter } from '../../lib/security';
import { supabase } from '../../lib/supabase';

describe('Rate Limiting', () => {
  it('prevents brute force attacks', async () => {
    const attempts = Array(10).fill(null).map(() => 
      supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrong'
      })
    );

    const results = await Promise.all(attempts.map(p => p.catch(e => e)));
    const blockedAttempts = results.filter(r => r instanceof Error);

    expect(blockedAttempts.length).toBeGreaterThan(0);
    expect(rateLimiter.isRateLimited('auth')).toBe(true);
  });

  it('resets rate limit after cooldown', async () => {
    vi.useFakeTimers();
    
    // Make max attempts
    for (let i = 0; i < 5; i++) {
      await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrong'
      });
    }

    expect(rateLimiter.isRateLimited('auth')).toBe(true);

    // Wait for cooldown
    vi.advanceTimersByTime(60 * 1000);
    expect(rateLimiter.isRateLimited('auth')).toBe(false);
  });
});