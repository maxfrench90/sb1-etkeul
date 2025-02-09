import React from 'react';
import DatePicker from 'react-datepicker';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import "react-datepicker/dist/react-datepicker.css";

interface BookingCalendarProps {
  providerId: string;
  onBookingConfirmed: (booking: {
    date: Date;
    timeSlot: string;
    providerId: string;
  }) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const TIME_SLOTS: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '10:00', available: true },
  { time: '11:00', available: true },
  { time: '12:00', available: true },
  { time: '13:00', available: true },
  { time: '14:00', available: true },
  { time: '15:00', available: true },
  { time: '16:00', available: true },
  { time: '17:00', available: true },
];

export function BookingCalendar({ providerId, onBookingConfirmed }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = React.useState<TimeSlot[]>(TIME_SLOTS);
  const [loading, setLoading] = React.useState(false);

  const loadAvailability = async (date: Date) => {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('start_time')
        .eq('provider_id', providerId)
        .eq('status', 'confirmed')
        .gte('start_time', format(startOfDay(date), "yyyy-MM-dd'T'HH:mm:ssXXX"))
        .lt('start_time', format(addDays(startOfDay(date), 1), "yyyy-MM-dd'T'HH:mm:ssXXX"));

      if (error) throw error;

      const bookedTimes = new Set(
        bookings.map(booking => format(new Date(booking.start_time), 'HH:mm'))
      );

      setAvailableSlots(
        TIME_SLOTS.map(slot => ({
          ...slot,
          available: !bookedTimes.has(slot.time)
        }))
      );
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedTime(null);
    if (date) {
      loadAvailability(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      const bookingDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        parseInt(selectedTime.split(':')[0]),
        parseInt(selectedTime.split(':')[1])
      );

      onBookingConfirmed({
        date: bookingDateTime,
        timeSlot: selectedTime,
        providerId
      });
    } catch (error) {
      console.error('Error creating booking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            minDate={new Date()}
            maxDate={addDays(new Date(), 30)}
            dateFormat="MMMM d, yyyy"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholderText="Select a date"
          />
        </div>
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Time Slots
          </label>
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map(({ time, available }) => (
              <button
                key={time}
                onClick={() => available && handleTimeSelect(time)}
                disabled={!available}
                className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium
                  ${available
                    ? selectedTime === time
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <Clock className="w-4 h-4 mr-2" />
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDate && selectedTime && (
        <div className="flex justify-end">
          <Button
            onClick={handleBooking}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Confirming...' : 'Confirm Booking'}
          </Button>
        </div>
      )}
    </div>
  );
}