import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useBookings } from '../../hooks/useBookings';
import { supabase } from '../../lib/supabase';

describe('Booking Management', () => {
  it('prevents double bookings', async () => {
    const { result } = renderHook(() => useBookings());
    
    // Create first booking
    await act(async () => {
      await result.current.createBooking({
        providerId: 'provider-1',
        startTime: '2024-03-01T10:00:00Z',
        endTime: '2024-03-01T11:00:00Z'
      });
    });

    // Attempt conflicting booking
    await expect(
      result.current.createBooking({
        providerId: 'provider-1',
        startTime: '2024-03-01T10:30:00Z',
        endTime: '2024-03-01T11:30:00Z'
      })
    ).rejects.toThrow('Time slot not available');
  });

  it('handles booking conflicts in real-time', async () => {
    const { result } = renderHook(() => useBookings());
    
    // Simulate concurrent bookings
    const booking1 = result.current.createBooking({
      providerId: 'provider-1',
      startTime: '2024-03-01T10:00:00Z',
      endTime: '2024-03-01T11:00:00Z'
    });

    const booking2 = result.current.createBooking({
      providerId: 'provider-1',
      startTime: '2024-03-01T10:00:00Z',
      endTime: '2024-03-01T11:00:00Z'
    });

    await expect(Promise.all([booking1, booking2])).rejects.toThrow();
  });
});