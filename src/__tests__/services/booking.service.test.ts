import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BookingService } from '../../services/booking.service';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('BookingService', () => {
  let bookingService: BookingService;

  beforeEach(() => {
    bookingService = new BookingService();
    vi.clearAllMocks();
  });

  describe('createBooking', () => {
    it('creates booking successfully', async () => {
      const mockUser = { id: 'user-123' };
      const mockBooking = {
        id: 'booking-123',
        client_id: mockUser.id,
        provider_id: 'provider-123',
        service_type: 'Dog Walking',
        start_time: '2024-03-01T10:00:00Z',
        end_time: '2024-03-01T11:00:00Z',
        status: 'pending'
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockBooking,
          error: null
        })
      }));

      const result = await bookingService.createBooking({
        providerId: 'provider-123',
        serviceType: 'Dog Walking',
        startTime: '2024-03-01T10:00:00Z',
        endTime: '2024-03-01T11:00:00Z'
      });

      expect(result).toEqual(mockBooking);
      expect(supabase.from).toHaveBeenCalledWith('bookings');
    });

    it('handles booking creation errors', async () => {
      const error = new Error('Failed to create booking');
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        insert: vi.fn().mockRejectedValueOnce(error)
      }));

      await expect(bookingService.createBooking({
        providerId: 'provider-123',
        serviceType: 'Dog Walking',
        startTime: '2024-03-01T10:00:00Z',
        endTime: '2024-03-01T11:00:00Z'
      })).rejects.toThrow('Failed to create booking');

      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'booking.create',
          error: error.message
        })
      );
    });
  });

  describe('getBookings', () => {
    it('fetches bookings with filters', async () => {
      const mockUser = { id: 'user-123' };
      const mockBookings = [
        {
          id: 'booking-1',
          client_id: mockUser.id,
          service_type: 'Dog Walking',
          status: 'confirmed'
        }
      ];

      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockBookings,
          error: null
        })
      }));

      const result = await bookingService.getBookings('client', {
        dateRange: {
          start: '2024-03-01',
          end: '2024-03-31'
        },
        status: ['confirmed']
      });

      expect(result).toEqual(mockBookings);
      expect(supabase.from).toHaveBeenCalledWith('bookings');
    });
  });
});