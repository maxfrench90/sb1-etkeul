import { describe, it, expect } from 'vitest';
import { securityHeaders } from '../../lib/security';

describe('Security Headers', () => {
  it('sets correct CSP headers', () => {
    expect(securityHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(securityHeaders['Content-Security-Policy']).toContain("script-src 'self'");
  });

  it('prevents clickjacking', () => {
    expect(securityHeaders['X-Frame-Options']).toBe('DENY');
  });

  it('enables XSS protection', () => {
    expect(securityHeaders['X-XSS-Protection']).toBe('1; mode=block');
  });
});