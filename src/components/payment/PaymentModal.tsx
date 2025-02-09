import React from 'react';
import { Elements } from '@stripe/stripe-js';
import { X } from 'lucide-react';
import { stripe } from '../../lib/stripe';
import { PaymentForm } from './PaymentForm';
import { supabase } from '../../lib/supabase';
import { sendBookingConfirmation } from '../../lib/email';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    providerId: string;
    date: Date;
    timeSlot: string;
    price: number;
    serviceType: string;
  };
}

export function PaymentModal({ isOpen, onClose, booking }: PaymentModalProps) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      initializePayment();
    }
  }, [isOpen]);

  const initializePayment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create a payment intent on your server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: booking.price * 100, // Convert to cents
          providerId: booking.providerId,
          serviceType: booking.serviceType,
          bookingDate: booking.date,
        }),
      });

      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get provider details
      const { data: provider } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', booking.providerId)
        .single();

      // Get client details
      const { data: client } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Create the booking record
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          provider_id: booking.providerId,
          service_type: booking.serviceType,
          start_time: booking.date,
          status: 'confirmed',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create the payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingData.id,
          amount: booking.price,
          status: 'completed',
          stripe_payment_id: paymentIntentId,
        });

      if (paymentError) throw paymentError;

      // Send confirmation emails
      await sendBookingConfirmation({
        clientName: client.full_name,
        clientEmail: client.email,
        providerName: provider.full_name,
        providerEmail: provider.email,
        serviceType: booking.serviceType,
        date: booking.date,
        time: booking.timeSlot,
        location: provider.location || 'Provider location',
        price: booking.price,
      });

      onClose();
    } catch (err) {
      setError('Failed to save booking. Please contact support.');
    }
  };

  if (!isOpen || !clientSecret) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Complete Payment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error ? (
            <div className="text-red-600 mb-4">{error}</div>
          ) : (
            <Elements stripe={stripe} options={{ clientSecret }}>
              <PaymentForm
                amount={booking.price}
                onSuccess={handlePaymentSuccess}
                onError={(err) => setError(err.message)}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}