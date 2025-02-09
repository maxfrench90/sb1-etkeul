import { useState, useCallback } from 'react';
import { optimisticUpdate } from '../lib/optimistic';
import { withRetry } from '../lib/retry';

interface MutationConfig<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  retry?: boolean;
  optimisticData?: (variables: TVariables) => TData;
  rollbackFn?: () => void;
}

export function useMutation<TData = unknown, TVariables = unknown>({
  mutationFn,
  onSuccess,
  onError,
  onSettled,
  retry = true,
  optimisticData,
  rollbackFn
}: MutationConfig<TData, TVariables>) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(
    async (variables: TVariables) => {
      setLoading(true);
      setError(null);

      try {
        let result: TData;

        if (optimisticData) {
          const optimisticResult = optimisticData(variables);
          result = await optimisticUpdate({
            key: 'mutation',
            data: optimisticResult,
            mutationFn: () => 
              retry ? withRetry(() => mutationFn(variables)) : mutationFn(variables),
            rollbackFn
          });
        } else {
          result = await (retry 
            ? withRetry(() => mutationFn(variables))
            : mutationFn(variables)
          );
        }

        setData(result);
        onSuccess?.(result, variables);
        onSettled?.(result, null, variables);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Mutation failed');
        setError(error);
        onError?.(error, variables);
        onSettled?.(undefined, error, variables);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, onSettled, retry, optimisticData, rollbackFn]
  );

  return {
    mutate,
    data,
    error,
    loading
  };
}