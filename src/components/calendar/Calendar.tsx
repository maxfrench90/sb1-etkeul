import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendar } from './CalendarProvider';

interface CalendarProps {
  onEventClick?: (eventId: string) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  selectable?: boolean;
  editable?: boolean;
}

export function Calendar({
  onEventClick,
  onDateSelect,
  selectable = false,
  editable = false
}: CalendarProps) {
  const { events } = useCalendar();

  const handleEventClick = (info: any) => {
    onEventClick?.(info.event.id);
  };

  const handleSelect = (info: any) => {
    onDateSelect?.(info.start, info.end);
  };

  return (
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
        borderColor: event.type === 'booking' ? '#059669' : '#4B5563'
      }))}
      eventClick={handleEventClick}
      select={handleSelect}
      selectable={selectable}
      editable={editable}
      selectMirror={true}
      dayMaxEvents={true}
      weekends={true}
      nowIndicator={true}
      slotMinTime="06:00:00"
      slotMaxTime="22:00:00"
      allDaySlot={false}
      height="auto"
      expandRows={true}
      stickyHeaderDates={true}
      handleWindowResize={true}
      className="bg-white rounded-lg shadow p-4"
    />
  );
}