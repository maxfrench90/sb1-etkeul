import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Download, RotateCw } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { BookingStats } from './BookingStats';
import { ExportDialog } from './ExportDialog';
import { RebookDialog } from './RebookDialog';
import { DateRangeFilter } from './DateRangeFilter';
import { FeedbackSummary } from './FeedbackSummary';
import { Toast } from '../ui/Toast';
import { errorMonitor } from '../../lib/monitoring';
import type { Booking } from '../../types';

interface BookingHistoryProps {
  userRole: 'client' | 'provider';
}

export function BookingHistory({ userRole }: BookingHistoryProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showRebookDialog, setShowRebookDialog] = useState(false);
  const [bookingToRebook, setBookingToRebook] = useState<Booking | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    action?: { label: string; onClick: () => void };
  } | null>(null);
  const [lastAction, setLastAction] = useState<{
    type: 'cancel' | 'confirm';
    bookings: string[];
  } | null>(null);

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('bookings')
        .select(`
          *,
          client:profiles!client_id(*),
          provider:profiles!provider_id(*),
          payment:payments(amount, status)
        `)
        .order('start_time', { ascending: false });

      query = query.eq(userRole === 'client' ? 'client_id' : 'provider_id', user.id);

      if (dateRange.start && dateRange.end) {
        query = query
          .gte('start_time', dateRange.start.toISOString())
          .lte('start_time', dateRange.end.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setBookings(data || []);

      await errorMonitor.logSuccess({
        operation: 'bookings.fetch',
        attempts: 1,
        duration: 0,
        context: { userRole, userId: user.id }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bookings';
      setError(errorMessage);

      await errorMonitor.logError({
        operation: 'bookings.fetch',
        error: errorMessage,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { userRole }
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadBookings();
  }, [userRole, dateRange]);

  const handleBulkAction = async (action: 'cancel' | 'confirm') => {
    if (selectedBookings.length === 0) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: action === 'cancel' ? 'cancelled' : 'confirmed' })
        .in('id', selectedBookings);

      if (error) throw error;

      setLastAction({ type: action, bookings: selectedBookings });
      setToast({
        message: `${selectedBookings.length} bookings ${action}ed`,
        type: 'success',
        action: {
          label: 'Undo',
          onClick: handleUndoAction
        }
      });
      
      setSelectedBookings([]);
      loadBookings();

      await errorMonitor.logSuccess({
        operation: 'bookings.bulk_action',
        attempts: 1,
        duration: 0,
        context: { action, count: selectedBookings.length }
      });
    } catch (err) {
      const errorMessage = `Failed to ${action} bookings`;
      setToast({
        message: errorMessage,
        type: 'error'
      });

      await errorMonitor.logError({
        operation: 'bookings.bulk_action',
        error: errorMessage,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { action, selectedBookings }
      });
    }
  };

  const handleUndoAction = async () => {
    if (!lastAction) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: lastAction.type === 'cancel' ? 'confirmed' : 'pending'
        })
        .in('id', lastAction.bookings);

      if (error) throw error;

      setToast({
        message: 'Action undone successfully',
        type: 'success'
      });
      
      loadBookings();
    } catch (err) {
      const errorMessage = 'Failed to undo action';
      setToast({
        message: errorMessage,
        type: 'error'
      });

      await errorMonitor.logError({
        operation: 'bookings.undo_action',
        error: errorMessage,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { lastAction }
      });
    } finally {
      setLastAction(null);
    }
  };

  const handleExportData = async (format: 'csv' | 'pdf', dateRange: string, fields: string[]) => {
    try {
      const exportData = bookings.map(booking => {
        const filteredBooking: Record<string, any> = {};
        fields.forEach(field => {
          if (field in booking) {
            filteredBooking[field] = booking[field as keyof Booking];
          }
        });
        return filteredBooking;
      });

      const fileName = `bookings_export_${format}_${new Date().toISOString()}.${format}`;
      const blob = format === 'csv' 
        ? new Blob([convertToCSV(exportData)], { type: 'text/csv' })
        : new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setToast({
        type: 'success',
        message: 'Export completed successfully'
      });
      setShowExportDialog(false);

      await errorMonitor.logSuccess({
        operation: 'bookings.export',
        attempts: 1,
        duration: 0,
        context: { format, fields }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setToast({
        type: 'error',
        message: errorMessage
      });

      await errorMonitor.logError({
        operation: 'bookings.export',
        error: errorMessage,
        severity: 'low',
        timestamp: new Date().toISOString(),
        context: { format, fields }
      });
    }
  };

  const handleRebook = async (bookingDetails: any) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingDetails,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setShowRebookDialog(false);
      setBookingToRebook(null);
      loadBookings();
      
      setToast({
        type: 'success',
        message: 'Booking rescheduled successfully'
      });

      await errorMonitor.logSuccess({
        operation: 'bookings.rebook',
        attempts: 1,
        duration: 0,
        context: { bookingId: data.id }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reschedule booking';
      setToast({
        type: 'error',
        message: errorMessage
      });

      await errorMonitor.logError({
        operation: 'bookings.rebook',
        error: errorMessage,
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { bookingDetails }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RotateCw className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        <p className="font-medium">Error loading bookings</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DateRangeFilter
        startDate={dateRange.start}
        endDate={dateRange.end}
        onRangeChange={(start, end) => setDateRange({ start, end })}
      />

      <BookingStats
        totalBookings={bookings.length}
        upcomingBookings={bookings.filter(b => new Date(b.start_time) > new Date()).length}
        completedBookings={bookings.filter(b => b.status === 'completed').length}
        canceledBookings={bookings.filter(b => b.status === 'cancelled').length}
        averageRating={4.5}
        weeklyTrend={[]}
      />

      {userRole === 'provider' && bookings[0]?.provider_id && (
        <FeedbackSummary
          providerId={bookings[0].provider_id}
          dateRange={dateRange.start && dateRange.end ? {
            start: dateRange.start,
            end: dateRange.end
          } : undefined}
        />
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {selectedBookings.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('cancel')}
                className="text-red-600 hover:bg-red-50"
              >
                Cancel Selected ({selectedBookings.length})
              </Button>
              <Button
                onClick={() => handleBulkAction('confirm')}
              >
                Confirm Selected
              </Button>
            </>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowExportDialog(true)}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <BookingList
        bookings={bookings}
        selectedBookings={selectedBookings}
        onSelect={(id) => {
          setSelectedBookings(prev =>
            prev.includes(id)
              ? prev.filter(bookingId => bookingId !== id)
              : [...prev, id]
          );
        }}
      />

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        bookings={bookings}
        userRole={userRole}
        onExport={handleExportData}
      />

      {bookingToRebook && (
        <RebookDialog
          isOpen={showRebookDialog}
          onClose={() => {
            setShowRebookDialog(false);
            setBookingToRebook(null);
          }}
          booking={bookingToRebook}
          onRebook={handleRebook}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','),
    ...data.map(obj => 
      headers.map(header => {
        const value = obj[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ];
  
  return rows.join('\n');
}

const BookingList = React.memo(({ bookings, selectedBookings, onSelect }: {
  bookings: Booking[];
  selectedBookings: string[];
  onSelect: (id: string) => void;
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: bookings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5
  });

  return (
    <div 
      ref={parentRef}
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
              <BookingRow
                booking={booking}
                isSelected={selectedBookings.includes(booking.id)}
                onSelect={onSelect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

const BookingRow = React.memo(({ booking, isSelected, onSelect }: {
  booking: Booking;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  return (
    <div className="flex items-center px-6 py-4 hover:bg-gray-50">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(booking.id)}
        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
      />
      <div className="ml-4 flex-1">
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
          </div>
        </div>
      </div>
    </div>
  );
});