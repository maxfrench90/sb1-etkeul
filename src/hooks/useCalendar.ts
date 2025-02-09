import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { errorMonitor } from '../lib/monitoring';

interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'booking' | 'availability';
  user_id: string;
}

export function useCalendar() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadEvents();
    subscribeToEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('provider_id', user.id);

      const { data: availability, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('provider_id', user.id);

      if (bookingsError) throw bookingsError;
      if (availabilityError) throw availabilityError;

      const events: Event[] = [
        ...(bookings || []).map(booking => ({
          id: booking.id,
          title: `Booking: ${booking.service_type}`,
          start: booking.start_time,
          end: booking.end_time,
          type: 'booking' as const,
          user_id: booking.provider_id
        })),
        ...(availability || []).map(slot => ({
          id: slot.id,
          title: 'Available',
          start: slot.start_time,
          end: slot.end_time,
          type: 'availability' as const,
          user_id: slot.provider_id
        }))
      ];

      setEvents(events);
    } catch (err) {
      await errorMonitor.logError({
        operation: 'calendar.loadEvents',
        error: err instanceof Error ? err.message : 'Failed to load events',
        severity: 'medium',
        timestamp: new Date().toISOString()
      });
    }
  };

  const subscribeToEvents = () => {
    const channel = supabase.channel('calendar_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, handleBookingChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'availability'
      }, handleAvailabilityChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleBookingChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setEvents(prev => [...prev, {
        id: payload.new.id,
        title: `Booking: ${payload.new.service_type}`,
        start: payload.new.start_time,
        end: payload.new.end_time,
        type: 'booking',
        user_id: payload.new.provider_id
      }]);
    } else if (payload.eventType === 'UPDATE') {
      setEvents(prev => prev.map(event =>
        event.id === payload.old.id
          ? {
              ...event,
              title: `Booking: ${payload.new.service_type}`,
              start: payload.new.start_time,
              end: payload.new.end_time
            }
          : event
      ));
    } else if (payload.eventType === 'DELETE') {
      setEvents(prev => prev.filter(event => event.id !== payload.old.id));
    }
  };

  const handleAvailabilityChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setEvents(prev => [...prev, {
        id: payload.new.id,
        title: 'Available',
        start: payload.new.start_time,
        end: payload.new.end_time,
        type: 'availability',
        user_id: payload.new.provider_id
      }]);
    } else if (payload.eventType === 'DELETE') {
      setEvents(prev => prev.filter(event => event.id !== payload.old.id));
    }
  };

  const addEvent = async (event: Omit<Event, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from(event.type === 'booking' ? 'bookings' : 'availability')
        .insert({
          provider_id: event.user_id,
          start_time: event.start,
          end_time: event.end,
          ...(event.type === 'booking' && { service_type: event.title.split(': ')[1] })
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'calendar.addEvent',
        error: err instanceof Error ? err.message : 'Failed to add event',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { event }
      });
      throw err;
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const event = events.find(e => e.id === id);
      if (!event) throw new Error('Event not found');

      const { error } = await supabase
        .from(event.type === 'booking' ? 'bookings' : 'availability')
        .update({
          start_time: updates.start,
          end_time: updates.end,
          ...(event.type === 'booking' && updates.title && {
            service_type: updates.title.split(': ')[1]
          })
        })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'calendar.updateEvent',
        error: err instanceof Error ? err.message : 'Failed to update event',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { id, updates }
      });
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const event = events.find(e => e.id === id);
      if (!event) throw new Error('Event not found');

      const { error } = await supabase
        .from(event.type === 'booking' ? 'bookings' : 'availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'calendar.deleteEvent',
        error: err instanceof Error ? err.message : 'Failed to delete event',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { id }
      });
      throw err;
    }
  };

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent
  };
}