import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AnalyticsDashboard } from '../../components/dashboard/AnalyticsDashboard';
import { supabase } from '../../lib/supabase';

describe('AnalyticsDashboard', () => {
  const mockBookingsData = {
    data: [
      {
        id: '1',
        created_at: '2024-02-01T10:00:00Z',
        start_time: '2024-02-01T10:00:00Z',
        service_type: 'Dog Walking',
        status: 'completed',
        payments: [{ amount: 50, status: 'completed' }]
      },
      {
        id: '2',
        created_at: '2024-02-02T11:00:00Z',
        start_time: '2024-02-02T11:00:00Z',
        service_type: 'Pet Grooming',
        status: 'cancelled',
        payments: [{ amount: 75, status: 'refunded' }]
      }
    ],
    error: null
  };

  beforeEach(() => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue(mockBookingsData)
    }));
  });

  it('renders loading state initially', () => {
    render(<AnalyticsDashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays analytics data correctly', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Bookings')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total bookings
      expect(screen.getByText('$50.00')).toBeInTheDocument(); // Revenue
      expect(screen.getByText('50.0%')).toBeInTheDocument(); // Conversion rate
    });
  });

  it('handles date range changes', async () => {
    render(<AnalyticsDashboard />);

    // TODO: Add date range picker interaction tests
    // This requires implementing the date range picker component first
  });

  it('displays all required charts', async () => {
    render(<AnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Booking Trends')).toBeInTheDocument();
      expect(screen.getByText('Service Distribution')).toBeInTheDocument();
      expect(screen.getByText('Popular Booking Times')).toBeInTheDocument();
    });
  });
});