import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';

interface BookingConfirmationProps {
  booking: {
    date: Date;
    timeSlot: string;
    providerId: string;
    providerName: string;
    serviceType: string;
    location: string;
    price: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export function BookingConfirmation({
  booking,
  onConfirm,
  onCancel
}: BookingConfirmationProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-center mb-6">
        <CheckCircle className="w-12 h-12 text-emerald-500" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">
        Booking Summary
      </h3>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">
              {format(booking.date, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-500">Date</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{booking.timeSlot}</p>
            <p className="text-sm text-gray-500">Time</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900">{booking.location}</p>
            <p className="text-sm text-gray-500">Location</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Service</span>
            <span className="font-medium text-gray-900">{booking.serviceType}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Provider</span>
            <span className="font-medium text-gray-900">{booking.providerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Price</span>
            <span className="font-medium text-gray-900">${booking.price.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-1/2"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:w-1/2"
          >
            Confirm & Pay
          </Button>
        </div>
      </div>
    </div>
  );
}