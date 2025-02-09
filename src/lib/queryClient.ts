import { QueryClient } from '@tanstack/react-query';
import { errorMonitor } from './monitoring';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
      onError: (error) => {
        errorMonitor.logError({
          operation: 'query.error',
          error: error instanceof Error ? error.message : 'Query failed',
          severity: 'medium',
          timestamp: new Date().toISOString()
        });
      }
    },
    mutations: {
      retry: 2,
      onError: (error) => {
        errorMonitor.logError({
          operation: 'mutation.error',
          error: error instanceof Error ? error.message : 'Mutation failed',
          severity: 'high',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
});