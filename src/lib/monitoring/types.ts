export interface ErrorLog {
  operation: string;
  error: string;
  context?: Record<string, any>;
  timestamp: string;
  retryCount?: number;
  userId?: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface SuccessLog {
  operation: string;
  attempts: number;
  duration: number;
  context?: Record<string, any>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByOperation: Record<string, number>;
  averageRetries: number;
  successRate: number;
  averageDuration: number;
}

export interface MetricsCollectorConfig {
  flushInterval?: number;
  bufferSize?: number;
  notificationEndpoint?: string;
}