import { useState, useCallback } from 'react';
import { errorMonitor } from '../lib/monitoring';
import { metricsCollector } from '../lib/monitoring';

interface AsyncOperationConfig {
  operation: string;
  severity?: 'low' | 'medium' | 'high';
  context?: Record<string, any>;
}

export function useAsyncOperation<T, P = void>(
  operationFn: (params: P) => Promise<T>,
  config: AsyncOperationConfig
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (params: P) => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const result = await operationFn(params);
      setData(result);

      // Log success
      await errorMonitor.logSuccess({
        operation: config.operation,
        attempts: 1,
        duration: performance.now() - startTime,
        context: config.context
      });

      // Track performance
      metricsCollector.recordEvent({
        type: 'performance',
        subtype: 'operation',
        success: true,
        duration: performance.now() - startTime,
        metadata: {
          operation: config.operation,
          ...config.context
        }
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Operation failed');
      setError(error);

      // Log error
      await errorMonitor.logError({
        operation: config.operation,
        error: error.message,
        severity: config.severity || 'medium',
        timestamp: new Date().toISOString(),
        context: config.context
      });

      throw error;
    } finally {
      setLoading(false);
    }
  }, [operationFn, config]);

  return {
    execute,
    loading,
    error,
    data,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    }
  };
}