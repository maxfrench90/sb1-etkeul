import { StateCreator } from 'zustand';
import { supabase } from '../lib/supabase';
import { errorMonitor } from '../lib/monitoring';
import type { Booking } from '../types';

export interface BookingStore {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  filters: {
    dateRange?: { start: Date; end: Date };
    status?: string[];
    serviceType?: string;
  };
  setFilters: (filters: BookingStore['filters']) => void;
  fetchBookings: () => Promise<void>;
  createBooking: (booking: Partial<Booking>) => Promise<void>;
  updateBooking: (id: string, updates: Partial<Booking>) => Promise<void>;
}

export const createBookingStore: StateCreator<BookingStore> = (set, get) => ({
  bookings: [],
  loading: false,
  error: null,
  filters: {},

  setFilters: (filters) => set({ filters }),

  fetchBookings: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('bookings')
        .select(`
          *,
          client:profiles!client_id(*),
          provider:profiles!provider_id(*),
          payment:payments(amount, status)
        `);

      const filters = get().filters;
      
      if (filters.dateRange?.start && filters.dateRange?.end) {
        query = query
          .gte('start_time', filters.dateRange.start.toISOString())
          .lte('start_time', filters.dateRange.end.toISOString());
      }

      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }

      if (filters.serviceType) {
        query = query.eq('service_type', filters.serviceType);
      }

      const { data, error } = await query.order('start_time', { ascending: false });

      if (error) throw error;
      set({ bookings: data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      set({ error: message });

      await errorMonitor.logError({
        operation: 'booking.fetch',
        error: message,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { filters: get().filters }
      });
    } finally {
      set({ loading: false });
    }
  },

  createBooking: async (booking) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('bookings')
        .insert({
          ...booking,
          client_id: user.id,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      get().fetchBookings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      set({ error: message });

      await errorMonitor.logError({
        operation: 'booking.create',
        error: message,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { booking }
      });
    } finally {
      set({ loading: false });
    }
  },

  updateBooking: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      get().fetchBookings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update booking';
      set({ error: message });

      await errorMonitor.logError({
        operation: 'booking.update',
        error: message,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { id, updates }
      });
    } finally {
      set({ loading: false });
    }
  }
});