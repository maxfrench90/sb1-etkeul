import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Transactions', () => {
  let userId: string;

  beforeEach(async () => {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id as string;
  });

  describe('Transaction Listing', () => {
    it('should handle pagination', async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('provider_id', userId)
        .range(0, 9); // First 10 items

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data?.length).toBeLessThanOrEqual(10);
    });

    it('should sort transactions by amount', async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('provider_id', userId)
        .order('amount', { ascending: false });

      expect(error).toBeNull();
      if (data && data.length > 1) {
        expect(Number(data[0].amount)).toBeGreaterThanOrEqual(Number(data[1].amount));
      }
    });
  });

  // ... existing transaction tests ...
});