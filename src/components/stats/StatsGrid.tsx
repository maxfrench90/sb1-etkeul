import React from 'react';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
  description?: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    timeframe?: string;
  };
}

interface StatsGridProps {
  stats: Stat[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ stats, columns = 4, className = '' }: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid gap-6 ${gridCols[columns]} ${className}`}>
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  {stat.label}
                </span>
                {stat.description && (
                  <Tooltip content={stat.description}>
                    <Info className="w-4 h-4 text-gray-400" />
                  </Tooltip>
                )}
              </div>
              {stat.change && (
                <div className={`flex items-center text-sm font-medium ${
                  stat.change.type === 'increase' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {stat.change.type === 'increase' ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {Math.abs(stat.change.value)}%
                  {stat.change.timeframe && (
                    <span className="text-gray-500 ml-1">
                      vs {stat.change.timeframe}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="mt-2">
              <span className="text-3xl font-semibold text-gray-900">
                {stat.value}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}