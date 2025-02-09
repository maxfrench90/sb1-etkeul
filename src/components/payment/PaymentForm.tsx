import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { usePayment } from './PaymentProvider';
import { Button } from '../ui/Button';
import { errorMonitor } from '../../lib/monitoring';

interface PaymentFormProps {
  amount: number;
  bookingId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function PaymentForm({
  amount,
  bookingId,
  onSuccess,
  onError
}: PaymentFormProps) {
  const { processPayment } = usePayment();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const { success, error } = await processPayment(amount, bookingId);

      if (success) {
        onSuccess?.();
      } else {
        throw new Error(error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      onError?.(errorMessage);

      await errorMonitor.logError({
        operation: 'payment.submit',
        error: errorMessage,
        severity: 'high',
        timestamp: new Date().toISOString(),
        context: { amount, bookingId }
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="card-element"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Card Details
        </label>
        <div
          id="card-element"
          className="p-3 border border-gray-300 rounded-md"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Total Amount: <span className="font-medium">${amount.toFixed(2)}</span>
        </p>
        <Button
          type="submit"
          disabled={processing}
          className="w-1/3"
        >
          {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}