import React from 'react';
import { X } from 'lucide-react';
import { BookingCalendar } from './BookingCalendar';
import { BookingConfirmation } from './BookingConfirmation';
import { PaymentModal } from '../payment/PaymentModal';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    id: string;
    name: string;
    serviceType: string;
    location: string;
    price: number;
  };
}

export function BookingModal({ isOpen, onClose, provider }: BookingModalProps) {
  const [step, setStep] = React.useState<'calendar' | 'confirmation'>('calendar');
  const [bookingDetails, setBookingDetails] = React.useState<any>(null);
  const [showPayment, setShowPayment] = React.useState(false);

  const handleBookingConfirmed = (details: any) => {
    setBookingDetails({
      ...details,
      providerName: provider.name,
      serviceType: provider.serviceType,
      location: provider.location,
      price: provider.price
    });
    setStep('confirmation');
  };

  const handleConfirmation = async () => {
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    setShowPayment(false);
    onClose();
  };

  const handleCancel = () => {
    setStep('calendar');
    setBookingDetails(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'calendar' ? 'Book Appointment' : 'Confirm Booking'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {step === 'calendar' ? (
              <BookingCalendar
                providerId={provider.id}
                onBookingConfirmed={handleBookingConfirmed}
              />
            ) : (
              <BookingConfirmation
                booking={bookingDetails}
                onConfirm={handleConfirmation}
                onCancel={handleCancel}
              />
            )}
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={handlePaymentComplete}
          booking={{
            providerId: provider.id,
            date: bookingDetails.date,
            timeSlot: bookingDetails.timeSlot,
            price: provider.price,
            serviceType: provider.serviceType
          }}
        />
      )}
    </>
  );
}