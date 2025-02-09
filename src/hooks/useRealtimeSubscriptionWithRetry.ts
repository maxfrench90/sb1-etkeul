import { useRealtimeSubscription } from './useRealtimeSubscription';
import { RetryStrategy } from '../lib/retryStrategy';
import { ConflictResolver } from '../lib/conflictResolution';
import { metricsCollector } from '../lib/monitoring';
import { useState, useCallback } from 'react';

interface UseRealtimeSubscriptionWithRetryConfig<T> extends Omit<
  Parameters<typeof useRealtimeSubscription>[0],
  'onInsert' | 'onUpdate' | 'onDelete'
> {
  retryConfig?: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
  };
  conflictStrategy?: 'server' | 'client' | 'last-write' | 'merge';
  mergeFn?: (local: T, server: T) => T;
  onConflict?: (local: T, server: T, resolved: T) => void;
  onRetry?: (error: any, attempt: number) => void;
}

export function useRealtimeSubscriptionWithRetry<T extends { id: string; updated_at: string }>({
  retryConfig,
  conflictStrategy = 'server',
  mergeFn,
  onConflict,
  onRetry,
  ...config
}: UseRealtimeSubscriptionWithRetryConfig<T>) {
  const [metrics, setMetrics] = useState(() => ({
    eventsProcessed: 0,
    retries: 0,
    conflicts: 0,
    errors: 0
  }));

  // Initialize retry strategy
  const retryStrategy = new RetryStrategy({
    ...retryConfig,
    onRetry: (error, attempt) => {
      onRetry?.(error, attempt);
      setMetrics(prev => ({ ...prev, retries: prev.retries + 1 }));
    }
  });

  // Initialize conflict resolver
  const conflictResolver = new ConflictResolver<T>();
  switch (conflictStrategy) {
    case 'client':
      conflictResolver.addStrategy({
        resolve: (local) => local,
        shouldResolve: () => true
      });
      break;
    case 'last-write':
      conflictResolver.addStrategy({
        resolve: (local, server) => {
          const localDate = new Date(local.updated_at);
          const serverDate = new Date(server.updated_at);
          return localDate > serverDate ? local : server;
        },
        shouldResolve: () => true
      });
      break;
    case 'merge':
      if (mergeFn) {
        conflictResolver.addStrategy({
          resolve: mergeFn,
          shouldResolve: () => true
        });
      }
      break;
    default: // server wins
      conflictResolver.addStrategy({
        resolve: (_, server) => server,
        shouldResolve: () => true
      });
  }

  // Wrap handlers with retry and conflict resolution
  const handleOperation = useCallback(async <TOperation extends 'INSERT' | 'UPDATE' | 'DELETE'>(
    type: TOperation,
    data: T | T[],
    operation: () => Promise<void>
  ) => {
    const startTime = Date.now();

    try {
      await retryStrategy.execute(async () => {
        // For updates, check for conflicts
        if (type === 'UPDATE') {
          const items = Array.isArray(data) ? data : [data];
          let hasConflicts = false;

          for (const item of items) {
            const serverData = await config.queryFn();
            const serverItem = serverData.find(i => i.id === item.id);

            if (serverItem && serverItem.updated_at !== item.updated_at) {
              hasConflicts = true;
              const resolved = conflictResolver.resolve(item, serverItem);
              
              onConflict?.(item, serverItem, resolved);
              setMetrics(prev => ({ ...prev, conflicts: prev.conflicts + 1 }));

              metricsCollector.recordEvent({
                type: 'conflict',
                success: true,
                metadata: {
                  itemId: item.id,
                  resolution: conflictStrategy
                }
              });
            }
          }

          if (hasConflicts) {
            // Refetch data after conflict resolution
            await config.queryFn();
            return;
          }
        }

        await operation();
      }, `${type.toLowerCase()}_operation`);

      setMetrics(prev => ({ ...prev, eventsProcessed: prev.eventsProcessed + 1 }));

      metricsCollector.recordEvent({
        type: 'realtime_event',
        subtype: type.toLowerCase(),
        success: true,
        duration: Date.now() - startTime,
        metadata: {
          dataSize: Array.isArray(data) ? data.length : 1
        }
      });
    } catch (error) {
      setMetrics(prev => ({ ...prev, errors: prev.errors + 1 }));

      metricsCollector.recordEvent({
        type: 'realtime_event',
        subtype: type.toLowerCase(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });

      throw error;
    }
  }, [config.queryFn, conflictResolver, conflictStrategy, onConflict, retryStrategy]);

  // Use base hook with wrapped handlers
  const subscription = useRealtimeSubscription({
    ...config,
    onInsert: async (data) => {
      await handleOperation('INSERT', data, async () => {
        config.onInsert?.(data);
      });
    },
    onUpdate: async (data) => {
      await handleOperation('UPDATE', data, async () => {
        config.onUpdate?.(data);
      });
    },
    onDelete: async (data) => {
      await handleOperation('DELETE', data, async () => {
        config.onDelete?.(data);
      });
    }
  });

  return {
    ...subscription,
    metrics
  };
}