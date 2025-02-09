import React from 'react';
import { format } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBookings } from '../../hooks/useBookings';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import type { Booking } from '../../types';

interface BookingListProps {
  userRole: 'client' | 'provider';
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
  onSelect: (bookingIds: string[]) => void;
}

export function BookingList({ userRole, filters, sort, onSelect }: BookingListProps) {
  const [page, setPage] = React.useState(1);
  const [selectedBookings, setSelectedBookings] = React.useState<string[]>([]);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const {
    bookings,
    isLoading,
    error,
    totalCount,
    prefetchNextPage
  } = useBookings({
    userRole,
    page,
    pageSize: 20,
    filters,
    sort
  });

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: bookings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Estimated row height
    overscan: 5
  });

  // Handle scroll to load more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      prefetchNextPage();
    }
  };

  // Handle selection
  const handleSelect = (bookingId: string) => {
    const newSelected = selectedBookings.includes(bookingId)
      ? selectedBookings.filter(id => id !== bookingId)
      : [...selectedBookings, bookingId];
    
    setSelectedBookings(newSelected);
    onSelect(newSelected);
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        Error loading bookings: {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="max-h-[600px] overflow-auto"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const booking = bookings[virtualRow.index];
            return (
              <div
                key={booking.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                className="border-b border-gray-200"
              >
                {isLoading ? (
                  <BookingRowSkeleton />
                ) : (
                  <BookingRow
                    booking={booking}
                    userRole={userRole}
                    isSelected={selectedBookings.includes(booking.id)}
                    onSelect={() => handleSelect(booking.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {bookings.length === 0 && !isLoading && (
        <div className="p-8 text-center text-gray-500">
          No bookings found
        </div>
      )}

      {isLoading && (
        <div className="p-4">
          <BookingRowSkeleton />
          <BookingRowSkeleton />
          <BookingRowSkeleton />
        </div>
      )}
    </div>
  );
}

function BookingRow({
  booking,
  userRole,
  isSelected,
  onSelect
}: {
  booking: Booking;
  userRole: 'client' | 'provider';
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="flex items-center p-4 hover:bg-gray-50">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="mr-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {format(new Date(booking.start_time), 'PPp')}
            </p>
            <p className="text-sm text-gray-500">
              {booking.service_type}
            </p>
          </div>
          <div className="flex items-center">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              booking.status === 'confirmed'
                ? 'bg-green-100 text-green-800'
                : booking.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {booking.status}
            </span>
            <p className="ml-4 text-sm text-gray-900">
              {userRole === 'client'
                ? booking.provider?.full_name
                : booking.client?.full_name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingRowSkeleton() {
  return (
    <div className="flex items-center p-4 animate-pulse">
      <div className="w-4 h-4 bg-gray-200 rounded mr-4" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="flex items-center">
        <div className="w-16 h-6 bg-gray-200 rounded-full mr-4" />
        <div className="w-32 h-4 bg-gray-200 rounded" />
      </div>
    </div>
  );
}