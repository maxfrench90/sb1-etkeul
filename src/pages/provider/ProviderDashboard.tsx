import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DashboardStats } from '../../types/dashboard';

export function ProviderDashboard() {
  const stats: DashboardStats = {
    totalBookings: 45,
    upcomingBookings: 8,
    completedBookings: 37,
    totalEarned: 2250
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Total Bookings" value={stats.totalBookings} />
          <StatCard label="Upcoming" value={stats.upcomingBookings} />
          <StatCard label="Completed" value={stats.completedBookings} />
          <StatCard label="Total Earned" value={`$${stats.totalEarned}`} />
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}