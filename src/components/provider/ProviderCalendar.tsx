import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendar } from '../../hooks/useCalendar';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Toast } from '../ui/Toast';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'booking' | 'availability';
}

export function ProviderCalendar() {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { events, addEvent, updateEvent, deleteEvent } = useCalendar();

  const handleDateSelect = (selectInfo: any) => {
    setSelectedSlot({
      start: selectInfo.start,
      end: selectInfo.end
    });
    setShowDialog(true);
  };

  const handleEventClick = async (clickInfo: any) => {
    if (clickInfo.event.extendedProps.type === 'availability') {
      if (window.confirm('Remove this availability slot?')) {
        try {
          await deleteEvent(clickInfo.event.id);
          setToast({
            type: 'success',
            message: 'Availability removed successfully'
          });
        } catch (error) {
          setToast({
            type: 'error',
            message: 'Failed to remove availability'
          });
        }
      }
    }
  };

  const handleAddAvailability = async () => {
    if (!selectedSlot) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await addEvent({
        title: 'Available',
        start: selectedSlot.start.toISOString(),
        end: selectedSlot.end.toISOString(),
        type: 'availability',
        user_id: user.id
      });

      setToast({
        type: 'success',
        message: 'Availability added successfully'
      });
    } catch (err) {
      await errorMonitor.logError({
        operation: 'calendar.addAvailability',
        error: err instanceof Error ? err.message : 'Failed to add availability',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { selectedSlot }
      });

      setToast({
        type: 'error',
        message: 'Failed to add availability'
      });
    } finally {
      setShowDialog(false);
      setSelectedSlot(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            backgroundColor: event.type === 'booking' ? '#10B981' : '#6B7280',
            borderColor: event.type === 'booking' ? '#059669' : '#4B5563',
            extendedProps: { type: event.type }
          }))}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          nowIndicator={true}
          selectConstraint={{
            startTime: '06:00',
            endTime: '22:00'
          }}
        />
      </div>

      <Dialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setSelectedSlot(null);
        }}
        title="Add Availability"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Add availability for:
            {selectedSlot && (
              <span className="font-medium text-gray-900">
                {' '}
                {selectedSlot.start.toLocaleString()} to{' '}
                {selectedSlot.end.toLocaleString()}
              </span>
            )}
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setSelectedSlot(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddAvailability}>
              Add Availability
            </Button>
          </div>
        </div>
      </Dialog>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}