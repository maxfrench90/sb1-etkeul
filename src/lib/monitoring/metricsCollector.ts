import { supabase } from '../supabase';

interface MetricEvent {
  type: 'realtime_event' | 'retry' | 'conflict' | 'cache_operation';
  subtype?: string;
  success: boolean;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

class MetricsCollector {
  private static instance: MetricsCollector;
  private events: Array<MetricEvent & { timestamp: number }> = [];
  private flushInterval = 30000; // 30 seconds
  private flushTimeout: NodeJS.Timeout | null = null;
  private retryAttempts = 0;
  private maxRetries = 3;

  private constructor() {
    this.scheduleFlush();
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  private scheduleFlush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flushTimeout = setTimeout(() => this.flush(), this.flushInterval);
  }

  recordEvent(event: Omit<MetricEvent, 'timestamp'>) {
    const fullEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(fullEvent);

    // If we have a lot of events, flush immediately
    if (this.events.length >= 50) {
      this.flush();
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug('[Metrics]', fullEvent);
    }
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Don't flush if not authenticated

      const eventsToFlush = [...this.events];
      this.events = [];

      const { error } = await supabase
        .from('metrics')
        .insert(
          eventsToFlush.map(event => ({
            ...event,
            user_id: user.id,
            timestamp: new Date(event.timestamp).toISOString()
          }))
        );

      if (error) {
        // If insert fails, put events back in queue
        this.events = [...eventsToFlush, ...this.events];
        throw error;
      }

      // Reset retry count on success
      this.retryAttempts = 0;
    } catch (err) {
      console.error('Failed to flush metrics:', err);

      // Implement exponential backoff for retries
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.retryAttempts - 1), 30000);
        setTimeout(() => this.flush(), delay);
      }
    } finally {
      this.scheduleFlush();
    }
  }

  destroy() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }
    this.flush().catch(console.error);
  }
}

export const metricsCollector = MetricsCollector.getInstance();