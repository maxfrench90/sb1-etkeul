import { useState, useCallback } from 'react';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { supabase } from '../lib/supabase';

interface QueryState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  totalCount: number;
}

interface QueryConfig {
  table: string;
  pageSize?: number;
  initialFilters?: Record<string, any>;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export function useQueryState<T>({ 
  table, 
  pageSize = 10,
  initialFilters = {},
  sortColumn,
  sortDirection = 'asc'
}: QueryConfig) {
  const [state, setState] = useState<QueryState<T>>({
    data: [],
    loading: true,
    error: null,
    page: 1,
    pageSize,
    totalCount: 0
  });

  const fetchData = useCallback(async (
    page: number,
    filters: Record<string, any> = {},
    sort?: { column: string; direction: 'asc' | 'desc' }
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let query = supabase
        .from(table)
        .select('*', { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          (query as PostgrestFilterBuilder<any>).eq(key, value);
        }
      });

      // Apply sorting
      if (sort?.column) {
        query = query.order(sort.column, { ascending: sort.direction === 'asc' });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setState(prev => ({
        ...prev,
        data: data || [],
        loading: false,
        page,
        totalCount: count || 0
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('An error occurred')
      }));
    }
  }, [table, pageSize]);

  const setPage = (page: number) => {
    fetchData(page, initialFilters, sortColumn ? { column: sortColumn, direction: sortDirection } : undefined);
  };

  const setFilters = (filters: Record<string, any>) => {
    fetchData(1, filters, sortColumn ? { column: sortColumn, direction: sortDirection } : undefined);
  };

  const setSort = (column: string, direction: 'asc' | 'desc') => {
    fetchData(state.page, initialFilters, { column, direction });
  };

  return {
    ...state,
    setPage,
    setFilters,
    setSort,
    refetch: () => fetchData(state.page, initialFilters, 
      sortColumn ? { column: sortColumn, direction: sortDirection } : undefined
    )
  };
}