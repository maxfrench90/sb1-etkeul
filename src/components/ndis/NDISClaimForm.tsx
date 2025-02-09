import React, { useState } from 'react';
import { FileText, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface ClaimDetails {
  bookingId: string;
  amount: number;
  serviceType: string;
  date: string;
}

export function NDISClaimForm({ claim }: { claim: ClaimDetails }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Submit NDIS claim
      const { error } = await supabase
        .from('ndis_claims')
        .insert({
          booking_id: claim.bookingId,
          amount: claim.amount,
          service_type: claim.serviceType,
          date: claim.date,
          status: 'pending',
          user_id: user.id
        });

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error('Claim submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 p-4 rounded-md">
        <p className="text-sm text-green-700">
          Your NDIS claim has been submitted successfully.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <FileText className="w-8 h-8 text-emerald-600" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Submit NDIS Claim
          </h3>
          <p className="text-sm text-gray-500">
            Submit a claim for NDIS reimbursement
          </p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md space-y-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Service Type</span>
          <span className="text-sm font-medium text-gray-900">
            {claim.serviceType}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Date</span>
          <span className="text-sm font-medium text-gray-900">
            {new Date(claim.date).toLocaleDateString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Amount</span>
          <span className="text-sm font-medium text-gray-900">
            ${claim.amount.toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Submitting...' : 'Submit NDIS Claim'}
      </Button>
    </div>
  );
}