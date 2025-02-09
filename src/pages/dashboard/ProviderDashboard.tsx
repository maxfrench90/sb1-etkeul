import React, { Suspense } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AnalyticsDashboard } from '../../components/dashboard/AnalyticsDashboard';

// Lazy load heavy components
const TransactionHistory = React.lazy(() => 
  import('../../components/transactions/TransactionHistory').then(m => ({ default: m.TransactionHistory }))
);
const BookingHistory = React.lazy(() => 
  import('../../components/bookings/BookingHistory').then(m => ({ default: m.BookingHistory }))
);

export default function ProviderDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
        
        <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto" />}>
          <AnalyticsDashboard />
        </Suspense>

        <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto" />}>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking History</h2>
            <BookingHistory userRole="provider" />
          </div>
        </Suspense>

        <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto" />}>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            <TransactionHistory />
          </div>
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

export { ProviderDashboard }