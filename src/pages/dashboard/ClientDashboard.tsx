import React, { Suspense } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../providers/AuthProvider';

// Lazy load heavy components
const TransactionHistory = React.lazy(() => 
  import('../../components/transactions/TransactionHistory').then(m => ({ default: m.TransactionHistory }))
);
const BookingHistory = React.lazy(() => 
  import('../../components/bookings/BookingHistory').then(m => ({ default: m.BookingHistory }))
);

export function ClientDashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.user_metadata.full_name || 'Client'}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Bookings"
            value="12"
            description="All time bookings"
          />
          <StatCard
            title="Active Bookings"
            value="2"
            description="Currently scheduled"
          />
          <StatCard
            title="Total Spent"
            value="$450"
            description="Last 30 days"
          />
        </div>

        <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto" />}>
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking History</h2>
            <BookingHistory userRole="client" />
          </div>
        </Suspense>

        <Suspense fallback={<LoadingSpinner size="lg" className="mx-auto" />}>
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            <TransactionHistory />
          </div>
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

// Make sure to export as default for lazy loading
export default ClientDashboard;