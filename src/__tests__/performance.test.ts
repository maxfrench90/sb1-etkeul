import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Performance', () => {
  it('should handle multiple concurrent requests', async () => {
    const requests = Array(10).fill(null).map(() => 
      supabase.from('transactions').select('*')
    );

    const start = performance.now();
    const results = await Promise.all(requests);
    const end = performance.now();

    expect(end - start).toBeLessThan(5000); // Should complete within 5 seconds
    results.forEach(({ error }) => expect(error).toBeNull());
  });

  it('should handle large data sets efficiently', async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .limit(100);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});