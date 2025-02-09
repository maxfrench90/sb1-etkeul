import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { DateRangePicker } from '../ui/DateRangePicker';
import { useBookings } from '../../hooks/useBookings';

interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate: Date | null;
}

export function RecurringBooking() {
  const [pattern, setPattern] = useState<RecurringPattern>({
    frequency: 'weekly',
    interval: 1,
    endDate: null
  });
  const { createBooking } = useBookings();

  const handleSubmit = async () => {
    // Generate recurring booking dates
    const dates = generateRecurringDates(pattern);
    
    // Create bookings in parallel with error handling
    await Promise.allSettled(
      dates.map(date => createBooking({ ...bookingDetails, date }))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Frequency
        </label>
        <select
          value={pattern.frequency}
          onChange={(e) => setPattern({
            ...pattern,
            frequency: e.target.value as RecurringPattern['frequency']
          })}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Repeat Every
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={pattern.interval}
            onChange={(e) => setPattern({
              ...pattern,
              interval: parseInt(e.target.value)
            })}
            className="block w-20 rounded-md border-gray-300"
          />
          <span className="text-gray-500">
            {pattern.frequency === 'daily' ? 'days' :
             pattern.frequency === 'weekly' ? 'weeks' : 'months'}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          End Date
        </label>
        <DateRangePicker
          startDate={null}
          endDate={pattern.endDate}
          onChange={([_, end]) => setPattern({
            ...pattern,
            endDate: end
          })}
        />
      </div>

      <Button onClick={handleSubmit}>
        Create Recurring Booking
      </Button>
    </div>
  );
}