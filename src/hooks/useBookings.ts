import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import type { Booking } from '../types';

interface UseBookingsOptions {
  userRole: 'client' | 'provider';
  page: number;
  pageSize: number;
  filters: {
    dateRange?: { start: Date | null; end: Date | null };
    status?: string[];
    serviceType?: string;
    search?: string;
  };
  sort?: {
    field: keyof Booking;
    direction: 'asc' | 'desc';
  };
}

export function useBookings({
  userRole,
  page,
  pageSize,
  filters,
  sort
}: UseBookingsOptions) {
  const queryClient = useQueryClient();
  const [totalCount, setTotalCount] = useState(0);

  // Build query key based on all parameters
  const queryKey = ['bookings', userRole, page, pageSize, filters, sort];

  // Fetch bookings with pagination, filtering, and sorting
  const fetchBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('bookings')
      .select(`
        *,
        client:profiles!client_id(*),
        provider:profiles!provider_id(*),
        payment:payments(amount, status)
      `, { count: 'exact' });

    // Apply role-based filter
    query = query.eq(
      userRole === 'client' ? 'client_id' : 'provider_id',
      user.id
    );

    // Apply date range filter
    if (filters.dateRange?.start && filters.dateRange?.end) {
      query = query
        .gte('start_time', filters.dateRange.start.toISOString())
        .lte('start_time', filters.dateRange.end.toISOString());
    }

    // Apply status filter
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }

    // Apply service type filter
    if (filters.serviceType) {
      query = query.eq('service_type', filters.serviceType);
    }

    // Apply search filter
    if (filters.search) {
      query = query.or(`
        service_type.ilike.%${filters.search}%,
        client.full_name.ilike.%${filters.search}%,
        provider.full_name.ilike.%${filters.search}%
      `);
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    } else {
      query = query.order('start_time', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    if (count !== null) {
      setTotalCount(count);
    }

    return data as Booking[];
  };

  // Set up query with caching
  const {
    data: bookings,
    isLoading,
    error,
    refetch
  } = useQuery<Booking[]>({
    queryKey,
    queryFn: fetchBookings,
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Set up real-time subscription
  useRealtimeSubscription<Booking>({
    table: 'bookings',
    filter: userRole === 'client' 
      ? `client_id=eq.${user?.id}`
      : `provider_id=eq.${user?.id}`,
    onInsert: (newBooking) => {
      queryClient.setQueryData<Booking[]>(queryKey, (old) => {
        if (!old) return [newBooking];
        return [...old, newBooking];
      });
    },
    onUpdate: (updatedBooking) => {
      queryClient.setQueryData<Booking[]>(queryKey, (old) => {
        if (!old) return [updatedBooking];
        return old.map(booking => 
          booking.id === updatedBooking.id ? updatedBooking : booking
        );
      });
    },
    onDelete: (deletedBooking) => {
      queryClient.setQueryData<Booking[]>(queryKey, (old) => {
        if (!old) return [];
        return old.filter(booking => booking.id !== deletedBooking.id);
      });
    }
  });

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    if (page * pageSize < totalCount) {
      const nextPageQueryKey = [
        'bookings',
        userRole,
        page + 1,
        pageSize,
        filters,
        sort
      ];
      queryClient.prefetchQuery({
        queryKey: nextPageQueryKey,
        queryFn: fetchBookings
      });
    }
  }, [page, pageSize, totalCount, queryClient, fetchBookings]);

  return {
    bookings: bookings || [],
    isLoading,
    error: error instanceof Error ? error.message : null,
    totalCount,
    prefetchNextPage
  };
}