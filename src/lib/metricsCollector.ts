import { supabase } from './supabase';

interface MetricEvent {
  type: 'realtime_event' | 'retry' | 'conflict' | 'cache_operation';
  subtype?: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

interface ConnectionMetrics {
  totalReconnections: number;
  lastReconnectAttempt: number;
  averageReconnectTime: number;
  successfulReconnects: number;
  failedReconnects: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  invalidations: number;
  size: number;
}

interface RealtimeMetrics {
  eventsProcessed: number;
  batchesProcessed: number;
  averageBatchSize: number;
  averageProcessingTime: number;
  errors: number;
  conflictsDetected: number;
  conflictsResolved: number;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private events: MetricEvent[] = [];
  private metrics = {
    connection: {
      totalReconnections: 0,
      lastReconnectAttempt: 0,
      averageReconnectTime: 0,
      successfulReconnects: 0,
      failedReconnects: 0
    } as ConnectionMetrics,
    cache: {
      hits: 0,
      misses: 0,
      invalidations: 0,
      size: 0
    } as CacheMetrics,
    realtime: {
      eventsProcessed: 0,
      batchesProcessed: 0,
      averageBatchSize: 0,
      averageProcessingTime: 0,
      errors: 0,
      conflictsDetected: 0,
      conflictsResolved: 0
    } as RealtimeMetrics
  };

  private constructor() {
    setInterval(() => this.flushMetrics(), 60000);
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  recordEvent(event: Omit<MetricEvent, 'timestamp'>) {
    const fullEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(fullEvent);
    this.updateMetrics(fullEvent);

    if (process.env.NODE_ENV === 'development') {
      console.debug('[Metrics]', fullEvent);
    }
  }

  private updateMetrics(event: MetricEvent) {
    switch (event.type) {
      case 'realtime_event':
        this.updateRealtimeMetrics(event);
        break;
      case 'retry':
        this.updateConnectionMetrics(event);
        break;
      case 'cache_operation':
        this.updateCacheMetrics(event);
        break;
      case 'conflict':
        this.updateConflictMetrics(event);
        break;
    }
  }

  private updateRealtimeMetrics(event: MetricEvent) {
    const { realtime } = this.metrics;
    realtime.eventsProcessed++;
    
    if (event.duration) {
      realtime.averageProcessingTime = (
        realtime.averageProcessingTime * (realtime.eventsProcessed - 1) +
        event.duration
      ) / realtime.eventsProcessed;
    }

    if (!event.success) {
      realtime.errors++;
    }

    if (event.subtype === 'batch') {
      realtime.batchesProcessed++;
      if (event.metadata?.batchSize) {
        realtime.averageBatchSize = (
          realtime.averageBatchSize * (realtime.batchesProcessed - 1) +
          event.metadata.batchSize
        ) / realtime.batchesProcessed;
      }
    }
  }

  private updateConnectionMetrics(event: MetricEvent) {
    const { connection } = this.metrics;
    connection.totalReconnections++;
    connection.lastReconnectAttempt = event.timestamp;

    if (event.success) {
      connection.successfulReconnects++;
      if (event.duration) {
        connection.averageReconnectTime = (
          connection.averageReconnectTime * (connection.successfulReconnects - 1) +
          event.duration
        ) / connection.successfulReconnects;
      }
    } else {
      connection.failedReconnects++;
    }
  }

  private updateCacheMetrics(event: MetricEvent) {
    const { cache } = this.metrics;
    switch (event.subtype) {
      case 'hit':
        cache.hits++;
        break;
      case 'miss':
        cache.misses++;
        break;
      case 'invalidate':
        cache.invalidations++;
        break;
    }
    if (event.metadata?.size !== undefined) {
      cache.size = event.metadata.size;
    }
  }

  private updateConflictMetrics(event: MetricEvent) {
    const { realtime } = this.metrics;
    realtime.conflictsDetected++;
    if (event.success) {
      realtime.conflictsResolved++;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now()
    };
  }

  private async flushMetrics() {
    if (this.events.length === 0) return;

    try {
      const { error } = await supabase
        .from('metrics')
        .insert(this.events);

      if (error) throw error;
      this.events = [];
    } catch (err) {
      console.error('Failed to flush metrics:', err);
    }
  }
}

// Export a singleton instance
export const metricsCollector = MetricsCollector.getInstance();