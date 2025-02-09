import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBookingStore } from '../../store/booking.store';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('BookingStore', () => {
  const mockSet = vi.fn();
  let store: ReturnType<typeof createBookingStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createBookingStore(mockSet, () => store);
  });

  describe('fetchBookings', () => {
    it('fetches bookings with filters', async () => {
      const mockUser = { id: 'user-123' };
      const mockBookings = [
        { id: '1', service_type: 'Dog Walking' }
      ];

      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockBookings,
          error: null
        })
      }));

      await store.fetchBookings();

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          bookings: mockBookings
        })
      );
    });

    it('handles fetch errors', async () => {
      const error = new Error('Failed to fetch');
      vi.mocked(supabase.from).mockImplementationOnce(() => {
        throw error;
      });

      await store.fetchBookings();

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          error: error.message
        })
      );
      expect(errorMonitor.logError).toHaveBeenCalled();
    });
  });

  describe('createBooking', () => {
    it('creates booking successfully', async () => {
      const mockUser = { id: 'user-123' };
      const mockBooking = {
        service_type: 'Dog Walking',
        provider_id: 'provider-123'
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        insert: vi.fn().mockResolvedValueOnce({
          error: null
        })
      }));

      await store.createBooking(mockBooking);

      expect(supabase.from).toHaveBeenCalledWith('bookings');
    });

    it('handles creation errors', async () => {
      const error = new Error('Failed to create');
      vi.mocked(supabase.from).mockImplementationOnce(() => {
        throw error;
      });

      await store.createBooking({});

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          error: error.message
        })
      );
      expect(errorMonitor.logError).toHaveBeenCalled();
    });
  });
});