import { useEffect, useRef, useCallback, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { queryCache } from '../lib/cache';
import { metricsCollector } from '../lib/monitoring';

interface SubscriptionConfig<T> {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  batchSize?: number;
  batchInterval?: number;
  onInsert?: (payload: T | T[]) => void;
  onUpdate?: (payload: T | T[]) => void;
  onDelete?: (payload: T | T[]) => void;
  onConnectionChange?: (status: 'CONNECTED' | 'DISCONNECTED') => void;
  customCacheUpdate?: (
    type: 'INSERT' | 'UPDATE' | 'DELETE',
    data: T | T[],
    currentCache: T[]
  ) => T[];
}

interface QueuedChange<T> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: T;
  timestamp: number;
}

export function useRealtimeSubscription<T extends { id: string }>({
  table,
  schema = 'public',
  event = '*',
  filter,
  batchSize = 10,
  batchInterval = 1000,
  onInsert,
  onUpdate,
  onDelete,
  onConnectionChange,
  customCacheUpdate
}: SubscriptionConfig<T>) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const queuedChangesRef = useRef<QueuedChange<T>[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const retryAttempts = useRef(0);

  // Process queued changes in batches
  const processBatch = useCallback(() => {
    if (queuedChangesRef.current.length === 0) return;

    const now = Date.now();
    const changes = queuedChangesRef.current
      .filter(change => now - change.timestamp <= 30000); // Only process changes from last 30 seconds

    // Group changes by type
    const grouped = changes.reduce((acc, change) => {
      if (!acc[change.type]) acc[change.type] = [];
      acc[change.type].push(change.payload);
      return acc;
    }, {} as Record<string, T[]>);

    // Process each type of change
    Object.entries(grouped).forEach(([type, payloads]) => {
      const handler = {
        INSERT: onInsert,
        UPDATE: onUpdate,
        DELETE: onDelete
      }[type as 'INSERT' | 'UPDATE' | 'DELETE'];

      if (handler) {
        handler(payloads.length === 1 ? payloads[0] : payloads);
      }

      // Update cache if custom handler provided
      if (customCacheUpdate) {
        const currentCache = queryCache.get<T[]>(`${table}:list`) || [];
        const updatedCache = customCacheUpdate(
          type as 'INSERT' | 'UPDATE' | 'DELETE',
          payloads,
          currentCache
        );
        queryCache.set(`${table}:list`, updatedCache);
      }
    });

    // Log metrics
    metricsCollector.recordEvent({
      type: 'realtime_event',
      subtype: 'batch',
      success: true,
      duration: Date.now() - now,
      metadata: {
        batchSize: changes.length,
        types: Object.keys(grouped)
      }
    });

    // Clear processed changes
    queuedChangesRef.current = queuedChangesRef.current.filter(
      change => now - change.timestamp > 30000
    );
  }, [table, onInsert, onUpdate, onDelete, customCacheUpdate]);

  // Handle payload with batching and offline support
  const handlePayload = useCallback((payload: any) => {
    const change: QueuedChange<T> = {
      type: payload.eventType,
      payload: payload.new || payload.old,
      timestamp: Date.now()
    };

    queuedChangesRef.current.push(change);

    // Process immediately if online and batch is full
    if (isOnline && queuedChangesRef.current.length >= batchSize) {
      processBatch();
    }
    // Otherwise, schedule batch processing
    else if (isOnline) {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      batchTimeoutRef.current = setTimeout(processBatch, batchInterval);
    }
  }, [isOnline, batchSize, batchInterval, processBatch]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onConnectionChange?.('CONNECTED');
      processBatch(); // Process any queued changes
    };

    const handleOffline = () => {
      setIsOnline(false);
      onConnectionChange?.('DISCONNECTED');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processBatch, onConnectionChange]);

  // Set up subscription with reconnection logic
  useEffect(() => {
    const setupSubscription = () => {
      if (!isOnline) return;

      const channel = supabase.channel(`public:${table}`)
        .on('postgres_changes', {
          event,
          schema,
          table,
          ...(filter && { filter })
        }, handlePayload)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${table} changes`);
            retryAttempts.current = 0;
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = undefined;
            }
          } else if (status === 'CLOSED' && isOnline) {
            // Attempt to reconnect with exponential backoff
            const retryDelay = Math.min(1000 * Math.pow(2, retryAttempts.current), 30000);
            retryTimeoutRef.current = setTimeout(setupSubscription, retryDelay);
            retryAttempts.current++;

            // Log reconnection attempt
            metricsCollector.recordEvent({
              type: 'retry',
              success: false,
              metadata: {
                attempt: retryAttempts.current,
                delay: retryDelay
              }
            });
          }
        });

      channelRef.current = channel;
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        console.log(`Unsubscribing from ${table} changes`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, [table, schema, event, filter, handlePayload, isOnline]);

  return {
    isOnline,
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    },
    processQueuedChanges: processBatch
  };
}