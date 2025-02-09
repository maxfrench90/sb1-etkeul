import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

interface UseSupabaseQueryOptions<T> {
  query: () => Promise<{ data: T[] | null; error: PostgrestError | null }>;
  dependencies?: any[];
}

export function useSupabaseQuery<T>({ query, dependencies = [] }: UseSupabaseQueryOptions<T>) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const { data, error } = await query();
        
        if (error) throw error;
        if (mounted) setData(data);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('An error occurred'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { data, error, loading };
}