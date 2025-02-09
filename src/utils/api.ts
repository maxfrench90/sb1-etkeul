import { supabase } from '../lib/supabase';
import { errorMonitor } from '../lib/monitoring';
import { withRetry } from '../lib/retry';

interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  sort?: { column: string; direction: 'asc' | 'desc' };
  range?: { from: number; to: number };
}

export const createApiClient = <T extends { id: string }>(resource: string) => {
  const handleError = async (error: unknown, operation: string, context?: any) => {
    const errorMessage = error instanceof Error ? error.message : 'Operation failed';
    await errorMonitor.logError({
      operation: `${resource}.${operation}`,
      error: errorMessage,
      severity: 'medium',
      timestamp: new Date().toISOString(),
      context
    });
    throw error;
  };

  return {
    getAll: async (options: QueryOptions = {}) => {
      try {
        let query = supabase.from(resource).select(options.select || '*');

        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }

        if (options.sort) {
          query = query.order(options.sort.column, {
            ascending: options.sort.direction === 'asc'
          });
        }

        if (options.range) {
          query = query.range(options.range.from, options.range.to);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as T[];
      } catch (error) {
        await handleError(error, 'getAll', options);
        return [];
      }
    },

    getById: async (id: string) => {
      try {
        const { data, error } = await supabase
          .from(resource)
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data as T;
      } catch (error) {
        await handleError(error, 'getById', { id });
      }
    },

    create: async (data: Partial<T>) => {
      try {
        const { data: result, error } = await withRetry(() =>
          supabase
            .from(resource)
            .insert(data)
            .select()
            .single()
        );

        if (error) throw error;
        return result as T;
      } catch (error) {
        await handleError(error, 'create', { data });
      }
    },

    update: async (id: string, data: Partial<T>) => {
      try {
        const { data: result, error } = await withRetry(() =>
          supabase
            .from(resource)
            .update(data)
            .eq('id', id)
            .select()
            .single()
        );

        if (error) throw error;
        return result as T;
      } catch (error) {
        await handleError(error, 'update', { id, data });
      }
    },

    delete: async (id: string) => {
      try {
        const { error } = await withRetry(() =>
          supabase
            .from(resource)
            .delete()
            .eq('id', id)
        );

        if (error) throw error;
      } catch (error) {
        await handleError(error, 'delete', { id });
      }
    },

    subscribe: (callback: (payload: any) => void) => {
      const channel = supabase.channel(`${resource}_changes`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: resource
        }, callback)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  };
};