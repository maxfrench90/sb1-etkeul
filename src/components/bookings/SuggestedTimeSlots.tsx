import React from 'react';
import { Clock, ThumbsUp } from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface SuggestedTimeSlotsProps {
  providerId: string;
  originalDate: Date;
  onTimeSelected: (date: Date, time: string) => void;
}

interface TimeSlot {
  date: Date;
  time: string;
  isRecommended: boolean;
  availability: 'high' | 'medium' | 'low';
}

export function SuggestedTimeSlots({ providerId, originalDate, onTimeSelected }: SuggestedTimeSlotsProps) {
  const [slots, setSlots] = React.useState<TimeSlot[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadAvailableSlots();
  }, [providerId, originalDate]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    try {
      // Get provider's existing bookings for the next 7 days
      const endDate = addDays(new Date(), 7);
      const { data: bookings } = await supabase
        .from('bookings')
        .select('start_time')
        .eq('provider_id', providerId)
        .gte('start_time', new Date().toISOString())
        .lte('start_time', endDate.toISOString());

      // Generate available time slots
      const timeSlots: TimeSlot[] = [];
      const bookedTimes = new Set(bookings?.map(b => b.start_time) || []);

      // Check next 7 days
      for (let i = 0; i < 7; i++) {
        const date = addDays(new Date(), i);
        ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].forEach(time => {
          const slotDate = new Date(date);
          slotDate.setHours(parseInt(time.split(':')[0]), 0, 0, 0);

          if (!bookedTimes.has(slotDate.toISOString())) {
            timeSlots.push({
              date: slotDate,
              time,
              isRecommended: isSameDay(slotDate, originalDate),
              availability: getAvailability(bookedTimes, slotDate)
            });
          }
        });
      }

      setSlots(timeSlots);
    } catch (error) {
      console.error('Error loading time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailability = (bookedTimes: Set<string>, date: Date): 'high' | 'medium' | 'low' => {
    const bookingsOnDay = Array.from(bookedTimes).filter(time => 
      isSameDay(new Date(time), date)
    ).length;

    if (bookingsOnDay <= 2) return 'high';
    if (bookingsOnDay <= 4) return 'medium';
    return 'low';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Suggested Time Slots</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {slots.map((slot, index) => (
          <button
            key={index}
            onClick={() => onTimeSelected(slot.date, slot.time)}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors
              ${slot.isRecommended 
                ? 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100' 
                : 'border-gray-200 hover:border-emerald-500 hover:bg-gray-50'}`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">
                {format(slot.date, 'EEE, MMM d')}
                <br />
                {slot.time}
              </span>
            </div>
            {slot.isRecommended && (
              <ThumbsUp className="w-4 h-4 text-emerald-500" />
            )}
            <span className={`px-2 py-1 text-xs rounded-full
              ${slot.availability === 'high' 
                ? 'bg-green-100 text-green-800'
                : slot.availability === 'medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'}`}>
              {slot.availability === 'high' ? 'Available' : slot.availability === 'medium' ? 'Filling' : 'Limited'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}