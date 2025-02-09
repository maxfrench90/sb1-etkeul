import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { errorMonitor } from '../../lib/monitoring';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'booking' | 'availability';
  booking_id?: string;
  user_id: string;
}

interface CalendarContextType {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setAvailability: (slots: Array<{ start: string; end: string }>) => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load initial events
    loadEvents();

    // Subscribe to calendar changes
    const channel = supabase.channel('calendar')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calendar_events',
        filter: `user_id=eq.${user.id}`
      }, handleCalendarChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setEvents(data);
    } catch (err) {
      await errorMonitor.logError({
        operation: 'calendar.loadEvents',
        error: err instanceof Error ? err.message : 'Failed to load calendar events',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { userId: user?.id }
      });
    }
  };

  const handleCalendarChange = (payload: any) => {
    const { eventType, new: newEvent, old: oldEvent } = payload;

    switch (eventType) {
      case 'INSERT':
        setEvents(prev => [...prev, newEvent]);
        break;
      case 'UPDATE':
        setEvents(prev =>
          prev.map(event =>
            event.id === oldEvent.id ? newEvent : event
          )
        );
        break;
      case 'DELETE':
        setEvents(prev =>
          prev.filter(event => event.id !== oldEvent.id)
        );
        break;
    }
  };

  const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .insert(event);

      if (error) throw error;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'calendar.addEvent',
        error: err instanceof Error ? err.message : 'Failed to add event',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { event }
      });
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'calendar.updateEvent',
        error: err instanceof Error ? err.message : 'Failed to update event',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { eventId: id, updates }
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'calendar.deleteEvent',
        error: err instanceof Error ? err.message : 'Failed to delete event',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { eventId: id }
      });
    }
  };

  const setAvailability = async (slots: Array<{ start: string; end: string }>) => {
    try {
      // Delete existing availability slots
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', user?.id)
        .eq('type', 'availability');

      // Insert new availability slots
      const { error } = await supabase
        .from('calendar_events')
        .insert(
          slots.map(slot => ({
            title: 'Available',
            start: slot.start,
            end: slot.end,
            type: 'availability',
            user_id: user?.id
          }))
        );

      if (error) throw error;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'calendar.setAvailability',
        error: err instanceof Error ? err.message : 'Failed to set availability',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { slots }
      });
    }
  };

  return (
    <CalendarContext.Provider value={{
      events,
      addEvent,
      updateEvent,
      deleteEvent,
      setAvailability
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}