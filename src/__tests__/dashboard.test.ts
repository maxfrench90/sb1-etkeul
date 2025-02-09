import { describe, it, expect } from 'vitest';
import { supabase } from '../lib/supabase';

describe('Dashboard', () => {
  it('should fetch provider statistics', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'provider') {
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('provider_id', user.id);

        expect(error).toBeNull();
        expect(Array.isArray(transactions)).toBe(true);
      }
    }
  });

  it('should fetch client statistics', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'client') {
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('client_id', user.id);

        expect(error).toBeNull();
        expect(Array.isArray(transactions)).toBe(true);
      }
    }
  });
});