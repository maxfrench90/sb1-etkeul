import React, { createContext, useContext } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { errorMonitor } from '../../lib/monitoring';

interface PaymentContextType {
  processPayment: (amount: number, bookingId: string) => Promise<{ success: boolean; error?: string }>;
  getPaymentHistory: () => Promise<any[]>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const processPayment = async (amount: number, bookingId: string) => {
    try {
      // Create payment intent
      const { data: { client_secret }, error: intentError } = await supabase
        .functions.invoke('create-payment-intent', {
          body: { amount, bookingId }
        });

      if (intentError) throw intentError;

      // Confirm payment
      const { error: confirmError } = await stripe!.confirmCardPayment(client_secret);
      if (confirmError) throw confirmError;

      // Record payment in database
      const { error: dbError } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          amount,
          status: 'completed',
          user_id: user?.id,
          created_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      return { success: true };
    } catch (err) {
      await errorMonitor.logError({
        operation: 'payment.process',
        error: err instanceof Error ? err.message : 'Payment failed',
        severity: 'high',
        timestamp: new Date().toISOString(),
        context: { amount, bookingId }
      });

      return {
        success: false,
        error: err instanceof Error ? err.message : 'Payment failed'
      };
    }
  };

  const getPaymentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          booking:bookings(
            id,
            service_type,
            start_time
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      await errorMonitor.logError({
        operation: 'payment.history',
        error: err instanceof Error ? err.message : 'Failed to load payment history',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: { userId: user?.id }
      });
      return [];
    }
  };

  return (
    <PaymentContext.Provider value={{
      processPayment,
      getPaymentHistory
    }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}