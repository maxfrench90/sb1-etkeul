import React from 'react';
import { Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface BulkActionsProps {
  selectedIds: string[];
  onActionComplete: () => void;
  onError: (error: Error) => void;
}

export function BulkActions({ selectedIds, onActionComplete, onError }: BulkActionsProps) {
  const [loading, setLoading] = React.useState(false);

  const handleStatusUpdate = async (status: 'active' | 'inactive') => {
    if (!selectedIds.length) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pets')
        .update({ status })
        .in('id', selectedIds);

      if (error) throw error;

      // Log the bulk action
      await supabase.from('audit_logs').insert({
        action: 'bulk_status_update',
        entity_type: 'pets',
        details: {
          ids: selectedIds,
          new_status: status
        }
      });

      onActionComplete();
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Failed to update status'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the selected pets?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      // Log the bulk deletion
      await supabase.from('audit_logs').insert({
        action: 'bulk_delete',
        entity_type: 'pets',
        details: {
          ids: selectedIds
        }
      });

      onActionComplete();
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Failed to delete pets'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => handleStatusUpdate('active')}
        disabled={loading || !selectedIds.length}
        className="flex items-center gap-2 text-green-600 hover:text-green-700"
      >
        <CheckCircle className="w-4 h-4" />
        Set Active
      </Button>
      <Button
        variant="outline"
        onClick={() => handleStatusUpdate('inactive')}
        disabled={loading || !selectedIds.length}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
      >
        <XCircle className="w-4 h-4" />
        Set Inactive
      </Button>
      <Button
        variant="outline"
        onClick={handleDelete}
        disabled={loading || !selectedIds.length}
        className="flex items-center gap-2 text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
    </div>
  );
}