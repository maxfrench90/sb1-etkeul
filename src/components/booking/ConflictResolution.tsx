import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { useBookings } from '../../hooks/useBookings';

interface ConflictResolutionProps {
  conflicts: Array<{
    date: Date;
    reason: string;
  }>;
  onResolve: (resolution: 'skip' | 'reschedule', date: Date) => void;
}

export function ConflictResolution({ conflicts, onResolve }: ConflictResolutionProps) {
  const [currentConflict, setCurrentConflict] = useState(0);
  const conflict = conflicts[currentConflict];

  const handleResolution = (resolution: 'skip' | 'reschedule') => {
    onResolve(resolution, conflict.date);
    
    if (currentConflict < conflicts.length - 1) {
      setCurrentConflict(prev => prev + 1);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onClose={() => {}}
      title="Booking Conflict"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 text-amber-600">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div>
            <p className="font-medium">
              Conflict found for {conflict.date.toLocaleDateString()}
            </p>
            <p className="text-sm text-amber-500 mt-1">
              {conflict.reason}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => handleResolution('skip')}
          >
            Skip This Date
          </Button>
          <Button
            onClick={() => handleResolution('reschedule')}
          >
            Find Alternative Time
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          Resolving conflict {currentConflict + 1} of {conflicts.length}
        </div>
      </div>
    </Dialog>
  );
}