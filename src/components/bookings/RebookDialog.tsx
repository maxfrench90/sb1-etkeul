import React, { useState } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Booking } from '../../types';

interface RebookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onRebook: (bookingDetails: {
    date: Date;
    timeSlot: string;
    serviceType: string;
  }) => void;
}

export function RebookDialog({ isOpen, onClose, booking, onRebook }: RebookDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState(booking.service_type);

  if (!isOpen) return null;

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00'
  ];

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) return;

    onRebook({
      date: selectedDate,
      timeSlot: selectedTime,
      serviceType
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Rebook Service</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="walking">Dog Walking</option>
                <option value="grooming">Pet Grooming</option>
                <option value="sitting">Pet Sitting</option>
                <option value="training">Pet Training</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <DatePicker
                  selected={selectedDate}
                  onChange={setSelectedDate}
                  minDate={new Date()}
                  dateFormat="MMMM d, yyyy"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholderText="Select a date"
                />
              </div>
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium
                        ${selectedTime === time
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedTime}
            >
              Confirm Rebooking
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}