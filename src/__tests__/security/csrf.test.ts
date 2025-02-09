import { describe, it, expect } from 'vitest';
import { validateRequest } from '../../lib/security';

describe('CSRF Protection', () => {
  it('validates CSRF tokens', () => {
    const validRequest = new Request('https://api.example.com', {
      headers: {
        'X-CSRF-Token': 'valid-token'
      }
    });

    const invalidRequest = new Request('https://api.example.com');

    expect(validateRequest(validRequest)).toBe(true);
    expect(validateRequest(invalidRequest)).toBe(false);
  });
});