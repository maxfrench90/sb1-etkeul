import { supabase } from './supabase';
import { queryCache } from './cache';

interface OptimisticConfig<T> {
  key: string;
  data: T;
  mutationFn: () => Promise<any>;
  rollbackFn?: () => void;
}

export async function optimisticUpdate<T>({
  key,
  data,
  mutationFn,
  rollbackFn
}: OptimisticConfig<T>) {
  // Get current cache state
  const previousData = queryCache.get(key);
  
  // Update cache optimistically
  queryCache.set(key, data);

  try {
    // Perform actual mutation
    await mutationFn();
  } catch (error) {
    // Revert cache on error
    if (previousData) {
      queryCache.set(key, previousData);
    } else {
      queryCache.clear(key);
    }

    // Execute custom rollback if provided
    if (rollbackFn) {
      rollbackFn();
    }

    throw error;
  }
}