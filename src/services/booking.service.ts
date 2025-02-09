import { BaseService } from './base.service';
import type { Booking } from '../types';

interface CreateBookingData {
  providerId: string;
  serviceType: string;
  startTime: string;
  endTime: string;
}

export class BookingService extends BaseService {
  async createBooking(data: CreateBookingData) {
    try {
      const { data: { user } } = await this.getClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: booking, error } = await this.getClient()
        .from('bookings')
        .insert({
          client_id: user.id,
          provider_id: data.providerId,
          service_type: data.serviceType,
          start_time: data.startTime,
          end_time: data.endTime,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return booking;
    } catch (error) {
      await this.handleError(error, 'booking.create', { data });
    }
  }

  async getBookings(role: 'client' | 'provider', filters?: any) {
    try {
      const { data: { user } } = await this.getClient().auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = this.getClient()
        .from('bookings')
        .select(`
          *,
          client:profiles!client_id(*),
          provider:profiles!provider_id(*),
          payment:payments(amount, status)
        `)
        .eq(role === 'client' ? 'client_id' : 'provider_id', user.id);

      // Apply filters
      if (filters?.dateRange?.start && filters?.dateRange?.end) {
        query = query
          .gte('start_time', filters.dateRange.start)
          .lte('start_time', filters.dateRange.end);
      }

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }

      const { data, error } = await query.order('start_time', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      await this.handleError(error, 'booking.getAll', { role, filters });
      return [];
    }
  }

  async updateBookingStatus(id: string, status: Booking['status']) {
    try {
      const { error } = await this.getClient()
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      await this.handleError(error, 'booking.updateStatus', { id, status });
    }
  }
}