import { useState, useEffect, useCallback } from 'react';
import { PostgrestError } from '@supabase/supabase-js';
import { queryCache } from '../lib/cache';
import { withRetry } from '../lib/retry';
import { supabase } from '../lib/supabase';

interface QueryConfig<T> {
  key: string;
  queryFn: () => Promise<T>;
  enabled?: boolean;
  retry?: boolean;
  cacheTime?: number;
  staleTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useQuery<T>({
  key,
  queryFn,
  enabled = true,
  retry = true,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  staleTime = 0,
  onSuccess,
  onError
}: QueryConfig<T>) {
  const [data, setData] = useState<T | null>(() => queryCache.get(key));
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(!data);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await (retry ? withRetry(queryFn) : queryFn());
      
      setData(result);
      queryCache.set(key, result, { ttl: cacheTime });
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Query failed');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [key, queryFn, retry, cacheTime, onSuccess, onError]);

  useEffect(() => {
    if (!enabled) return;

    const cachedData = queryCache.get<T>(key, { ttl: staleTime });
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    fetchData();
  }, [enabled, key, staleTime, fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    loading,
    refetch
  };
}