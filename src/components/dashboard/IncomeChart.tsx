import React from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];

export function IncomeChart() {
  const [monthlyIncome, setMonthlyIncome] = React.useState<{ month: string; total: number }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadIncome() {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data, error } = await supabase
          .from('transactions')
          .select('amount, created_at')
          .eq('provider_id', user.user.id)
          .eq('status', 'completed');

        if (error) throw error;

        // Group by month and calculate totals
        const incomeByMonth = (data as Transaction[]).reduce((acc, transaction) => {
          const month = new Date(transaction.created_at).toLocaleString('default', { month: 'long' });
          acc[month] = (acc[month] || 0) + Number(transaction.amount);
          return acc;
        }, {} as Record<string, number>);

        setMonthlyIncome(
          Object.entries(incomeByMonth).map(([month, total]) => ({ month, total }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load income data');
      } finally {
        setLoading(false);
      }
    }

    loadIncome();
  }, []);

  if (loading) return <div>Loading income data...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Income</h3>
      <div className="space-y-4">
        {monthlyIncome.map(({ month, total }) => (
          <div key={month} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{month}</span>
            <span className="text-sm font-medium text-gray-900">${total.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}