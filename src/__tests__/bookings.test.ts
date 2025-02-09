import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingHistory } from '../components/bookings/BookingHistory';
import { supabase } from '../lib/supabase';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(),
        order: vi.fn(),
        gte: vi.fn(),
        lte: vi.fn()
      }))
    }))
  }
}));

describe('BookingHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays bookings', async () => {
    // Mock authenticated user
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null
    });

    // Mock bookings data
    const mockBookings = [{
      id: '1',
      service_type: 'Dog Walking',
      start_time: new Date().toISOString(),
      status: 'confirmed',
      provider: { full_name: 'John Doe' }
    }];

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: mockBookings, error: null })
        })
      })
    }));

    render(<BookingHistory userRole="client" />);

    // Check loading state
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Dog Walking')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    // Mock auth error
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated')
    });

    render(<BookingHistory userRole="client" />);

    await waitFor(() => {
      expect(screen.getByText(/error loading bookings/i)).toBeInTheDocument();
    });
  });

  it('allows bulk actions on selected bookings', async () => {
    // Mock successful data and update
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null
    });

    const mockBookings = [{
      id: '1',
      service_type: 'Dog Walking',
      start_time: new Date().toISOString(),
      status: 'pending'
    }];

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: mockBookings, error: null })
        })
      }),
      update: () => ({
        in: () => Promise.resolve({ error: null })
      })
    }));

    render(<BookingHistory userRole="client" />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Dog Walking')).toBeInTheDocument();
    });

    // Select booking and confirm
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Confirm Selected'));

    await waitFor(() => {
      expect(screen.getByText(/bookings confirmed/i)).toBeInTheDocument();
    });
  });
});