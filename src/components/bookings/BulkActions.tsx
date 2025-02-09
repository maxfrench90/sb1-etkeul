import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface BulkActionsProps {
  selectedBookings: string[];
  onActionComplete: () => void;
}

export function BulkActions({ selectedBookings, onActionComplete }: BulkActionsProps) {
  const [loading, setLoading] = React.useState(false);

  const handleBulkCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel these bookings?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .in('id', selectedBookings);

      if (error) throw error;
      onActionComplete();
    } catch (err) {
      console.error('Error canceling bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkConfirm = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .in('id', selectedBookings);

      if (error) throw error;
      onActionComplete();
    } catch (err) {
      console.error('Error confirming bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleBulkCancel}
        disabled={loading}
        className="text-red-600 hover:bg-red-50"
      >
        Cancel Selected
      </Button>
      <Button
        onClick={handleBulkConfirm}
        disabled={loading}
      >
        Confirm Selected
      </Button>
    </div>
  );
}