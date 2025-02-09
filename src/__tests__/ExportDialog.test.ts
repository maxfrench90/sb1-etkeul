import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportDialog } from '../components/bookings/ExportDialog';

describe('ExportDialog', () => {
  const mockBookings = [
    {
      id: '1',
      start_time: '2024-01-01T10:00:00Z',
      end_time: '2024-01-01T11:00:00Z',
      service_type: 'Dog Walking',
      status: 'completed',
      created_at: '2024-01-01T09:00:00Z'
    }
  ];

  it('renders export options when open', () => {
    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        bookings={mockBookings}
        userRole="client"
        onExport={() => {}}
      />
    );

    expect(screen.getByText('Export Bookings')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Fields to Export')).toBeInTheDocument();
  });

  it('handles field selection', () => {
    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        bookings={mockBookings}
        userRole="client"
        onExport={() => {}}
      />
    );

    const dateCheckbox = screen.getByLabelText('Date');
    fireEvent.click(dateCheckbox);
    expect(dateCheckbox).not.toBeChecked();
  });

  it('calls onExport with correct parameters', () => {
    const mockExport = vi.fn();
    render(
      <ExportDialog
        isOpen={true}
        onClose={() => {}}
        bookings={mockBookings}
        userRole="client"
        onExport={mockExport}
      />
    );

    fireEvent.click(screen.getByText('Export CSV'));
    expect(mockExport).toHaveBeenCalledWith('csv', 'all', expect.any(Array));
  });

  it('does not render when closed', () => {
    render(
      <ExportDialog
        isOpen={false}
        onClose={() => {}}
        bookings={mockBookings}
        userRole="client"
        onExport={() => {}}
      />
    );

    expect(screen.queryByText('Export Bookings')).not.toBeInTheDocument();
  });
});