import { useState, useEffect, useCallback } from 'react';
import { useQuery } from './useQuery';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import type { PostgrestError } from '@supabase/supabase-js';

interface RealtimeQueryConfig<T> {
  queryKey: string;
  table: string;
  queryFn: () => Promise<T[]>;
  filter?: string;
  batchSize?: number;
  batchInterval?: number;
  onError?: (error: Error) => void;
  onConnectionChange?: (status: 'CONNECTED' | 'DISCONNECTED') => void;
  customCacheUpdate?: (
    type: 'INSERT' | 'UPDATE' | 'DELETE',
    data: T | T[],
    currentCache: T[]
  ) => T[];
}

export function useRealtimeQuery<T extends { id: string }>({
  queryKey,
  table,
  queryFn,
  filter,
  batchSize,
  batchInterval,
  onError,
  onConnectionChange,
  customCacheUpdate
}: RealtimeQueryConfig<T>) {
  const [realtimeData, setRealtimeData] = useState<T[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('CONNECTED');

  // Initial query with caching
  const { data: initialData, error, loading, refetch } = useQuery<T[]>({
    key: queryKey,
    queryFn,
    onError,
    // Shorter cache time since we have real-time updates
    cacheTime: 2 * 60 * 1000 // 2 minutes
  });

  // Update local state when initial data changes
  useEffect(() => {
    if (initialData) {
      setRealtimeData(initialData);
    }
  }, [initialData]);

  // Custom cache update handlers
  const handleCacheUpdate = useCallback((
    type: 'INSERT' | 'UPDATE' | 'DELETE',
    data: T | T[],
    currentCache: T[]
  ) => {
    if (customCacheUpdate) {
      return customCacheUpdate(type, data, currentCache);
    }

    // Default cache update behavior
    const items = Array.isArray(data) ? data : [data];
    switch (type) {
      case 'INSERT':
        return [...items, ...currentCache];
      case 'UPDATE':
        return currentCache.map(item => {
          const updated = items.find(i => i.id === item.id);
          return updated || item;
        });
      case 'DELETE':
        return currentCache.filter(item => 
          !items.some(i => i.id === item.id)
        );
      default:
        return currentCache;
    }
  }, [customCacheUpdate]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((status: 'CONNECTED' | 'DISCONNECTED') => {
    setConnectionStatus(status);
    onConnectionChange?.(status);

    if (status === 'CONNECTED') {
      refetch(); // Refresh data when connection is restored
    }
  }, [onConnectionChange, refetch]);

  // Set up real-time subscription
  const { isOnline } = useRealtimeSubscription<T>({
    table,
    filter,
    batchSize,
    batchInterval,
    onInsert: (data) => {
      setRealtimeData(current => handleCacheUpdate('INSERT', data, current));
    },
    onUpdate: (data) => {
      setRealtimeData(current => handleCacheUpdate('UPDATE', data, current));
    },
    onDelete: (data) => {
      setRealtimeData(current => handleCacheUpdate('DELETE', data, current));
    },
    onConnectionChange: handleConnectionChange,
    customCacheUpdate: handleCacheUpdate
  });

  return {
    data: realtimeData,
    error,
    loading,
    isOnline,
    connectionStatus,
    refetch
  };
}