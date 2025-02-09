import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  invalidateOnMutation?: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  // Get cached data with optional invalidation check
  get<T>(key: string, config: CacheConfig = {}): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const { ttl = this.defaultTTL } = config;
    const isExpired = Date.now() - entry.timestamp > ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Set cache entry with subscription for real-time updates
  set<T>(key: string, data: T, config: CacheConfig = {}) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    if (config.invalidateOnMutation) {
      this.setupRealtimeSubscription(key);
    }
  }

  // Clear specific cache entry
  clear(key: string) {
    this.cache.delete(key);
    this.unsubscribe(key);
  }

  // Clear all cache entries
  clearAll() {
    this.cache.clear();
    this.unsubscribeAll();
  }

  // Setup real-time subscription for cache invalidation
  private setupRealtimeSubscription(key: string) {
    const [table] = key.split(':');
    if (!table || this.subscriptions.has(key)) return;

    const channel = supabase.channel(`cache:${key}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table
      }, () => {
        this.clear(key);
      })
      .subscribe();

    this.subscriptions.set(key, channel);
  }

  private unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(key);
    }
  }

  private unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
  }
}

export const queryCache = new QueryCache();