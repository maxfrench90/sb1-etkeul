import React, { useState } from 'react';
import { Calendar, TrendingUp, DollarSign, Users, Clock } from 'lucide-react';
import { AreaChart } from '../charts/AreaChart';
import { BarChart } from '../charts/BarChart';
import { PieChart } from '../charts/PieChart';
import { ChartCard } from '../charts/ChartCard';
import { ChartGrid } from '../charts/ChartGrid';
import { DateRangePicker } from '../ui/DateRangePicker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AnalyticsData {
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    revenue: number;
    dailyStats: Array<{
      date: string;
      bookings: number;
      revenue: number;
    }>;
    serviceDistribution: Array<{
      name: string;
      value: number;
    }>;
    timeDistribution: Array<{
      hour: string;
      bookings: number;
    }>;
  };
}

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    subDays(new Date(), 30),
    new Date()
  ]);

  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['analytics', dateRange],
    queryFn: async () => {
      if (!dateRange[0] || !dateRange[1]) throw new Error('Invalid date range');

      const startDate = startOfDay(dateRange[0]).toISOString();
      const endDate = endOfDay(dateRange[1]).toISOString();

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          payments (
            amount,
            status
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      // Process bookings data
      const dailyStats = new Map<string, { bookings: number; revenue: number }>();
      const serviceStats = new Map<string, number>();
      const timeStats = new Map<string, number>();
      let totalRevenue = 0;
      let completedCount = 0;
      let cancelledCount = 0;

      bookings?.forEach(booking => {
        // Daily stats
        const date = format(new Date(booking.created_at), 'yyyy-MM-dd');
        const dailyStat = dailyStats.get(date) || { bookings: 0, revenue: 0 };
        dailyStats.set(date, {
          bookings: dailyStat.bookings + 1,
          revenue: dailyStat.revenue + (booking.payments?.[0]?.amount || 0)
        });

        // Service distribution
        serviceStats.set(
          booking.service_type,
          (serviceStats.get(booking.service_type) || 0) + 1
        );

        // Time distribution
        const hour = format(new Date(booking.start_time), 'HH:00');
        timeStats.set(hour, (timeStats.get(hour) || 0) + 1);

        // Totals
        if (booking.status === 'completed') {
          completedCount++;
          totalRevenue += booking.payments?.[0]?.amount || 0;
        } else if (booking.status === 'cancelled') {
          cancelledCount++;
        }
      });

      return {
        bookings: {
          total: bookings?.length || 0,
          completed: completedCount,
          cancelled: cancelledCount,
          revenue: totalRevenue,
          dailyStats: Array.from(dailyStats.entries()).map(([date, stats]) => ({
            date,
            ...stats
          })),
          serviceDistribution: Array.from(serviceStats.entries()).map(([name, value]) => ({
            name,
            value
          })),
          timeDistribution: Array.from(timeStats.entries()).map(([hour, bookings]) => ({
            hour,
            bookings
          }))
        }
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p className="font-medium">Error loading analytics</p>
        <p className="text-sm mt-1">
          {error instanceof Error ? error.message : 'An error occurred'}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <DateRangePicker
          startDate={dateRange[0]}
          endDate={dateRange[1]}
          onChange={(dates) => setDateRange(dates)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ChartCard
          title="Total Bookings"
          description="Total number of bookings in selected period"
          className="bg-emerald-50"
        >
          <div className="flex items-center justify-between">
            <Calendar className="w-8 h-8 text-emerald-600" />
            <span className="text-3xl font-bold text-emerald-600">
              {data.bookings.total}
            </span>
          </div>
        </ChartCard>

        <ChartCard
          title="Completed Bookings"
          description="Number of completed bookings"
          className="bg-blue-50"
        >
          <div className="flex items-center justify-between">
            <Clock className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-blue-600">
              {data.bookings.completed}
            </span>
          </div>
        </ChartCard>

        <ChartCard
          title="Total Revenue"
          description="Revenue from completed bookings"
          className="bg-green-50"
        >
          <div className="flex items-center justify-between">
            <DollarSign className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-green-600">
              ${data.bookings.revenue.toFixed(2)}
            </span>
          </div>
        </ChartCard>

        <ChartCard
          title="Conversion Rate"
          description="Percentage of completed vs total bookings"
          className="bg-purple-50"
        >
          <div className="flex items-center justify-between">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold text-purple-600">
              {((data.bookings.completed / data.bookings.total) * 100).toFixed(1)}%
            </span>
          </div>
        </ChartCard>
      </div>

      <ChartGrid>
        <ChartCard
          title="Booking Trends"
          description="Daily booking and revenue trends"
        >
          <AreaChart
            data={data.bookings.dailyStats}
            xKey="date"
            yKey="bookings"
            height={300}
            color="#10B981"
          />
        </ChartCard>

        <ChartCard
          title="Service Distribution"
          description="Distribution of bookings by service type"
        >
          <PieChart
            data={data.bookings.serviceDistribution}
            height={300}
          />
        </ChartCard>

        <ChartCard
          title="Popular Booking Times"
          description="Number of bookings by time of day"
        >
          <BarChart
            data={data.bookings.timeDistribution}
            xKey="hour"
            yKey="bookings"
            height={300}
            color="#8B5CF6"
          />
        </ChartCard>
      </ChartGrid>
    </div>
  );
}