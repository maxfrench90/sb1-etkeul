import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BookingHistory } from '../../components/bookings/BookingHistory';
import { useAuth } from '../../providers/AuthProvider';

function BookingsPage() {
  const { user } = useAuth();
  const userRole = user?.user_metadata.role === 'provider' ? 'provider' : 'client';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <BookingHistory userRole={userRole} />
      </div>
    </DashboardLayout>
  );
}

export default BookingsPage;