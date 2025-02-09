import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../test/utils';
import { BookingModal } from '../../components/booking/BookingModal';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('Booking Flow', () => {
  const mockProvider = {
    id: 'provider-1',
    name: 'John Doe',
    serviceType: 'Dog Walking',
    location: 'Sydney CBD',
    price: 50
  };

  it('completes booking flow successfully', async () => {
    // Mock successful API calls
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'bookings') {
        return {
          insert: vi.fn().mockResolvedValue({ data: { id: 'booking-1' }, error: null }),
          select: vi.fn().mockReturnThis()
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });

    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={() => {}}
        provider={mockProvider}
      />
    );

    // Select date and time
    const dateInput = screen.getByPlaceholderText(/select a date/i);
    fireEvent.change(dateInput, { target: { value: '2024-12-31' } });

    const timeSlot = screen.getByText('10:00');
    fireEvent.click(timeSlot);

    // Confirm booking
    const confirmButton = screen.getByText(/confirm booking/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('bookings');
      expect(errorMonitor.logSuccess).toHaveBeenCalled();
    });
  });

  it('handles booking conflicts', async () => {
    // Mock existing booking
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'bookings') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{
              start_time: '2024-12-31T10:00:00Z',
              end_time: '2024-12-31T11:00:00Z'
            }],
            error: null
          })
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null })
      };
    });

    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={() => {}}
        provider={mockProvider}
      />
    );

    // Try to book conflicting time
    const dateInput = screen.getByPlaceholderText(/select a date/i);
    fireEvent.change(dateInput, { target: { value: '2024-12-31' } });

    await waitFor(() => {
      const timeSlot = screen.getByText('10:00');
      expect(timeSlot.parentElement).toBeDisabled();
    });
  });

  it('validates booking inputs', async () => {
    renderWithProviders(
      <BookingModal
        isOpen={true}
        onClose={() => {}}
        provider={mockProvider}
      />
    );

    // Try to confirm without selecting date/time
    const confirmButton = screen.getByText(/confirm booking/i);
    expect(confirmButton).toBeDisabled();

    // Select invalid date (past)
    const dateInput = screen.getByPlaceholderText(/select a date/i);
    fireEvent.change(dateInput, { target: { value: '2020-01-01' } });

    await waitFor(() => {
      expect(screen.getByText(/cannot select past dates/i)).toBeInTheDocument();
    });
  });
});