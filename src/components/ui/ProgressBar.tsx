import React from 'react';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'emerald' | 'blue' | 'amber';
}

export function ProgressBar({
  progress,
  className = '',
  showLabel = true,
  size = 'md',
  color = 'emerald'
}: ProgressBarProps) {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    emerald: 'bg-emerald-600',
    blue: 'bg-blue-600',
    amber: 'bg-amber-600'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
          <div
            className={`${colorClasses[color]} transition-all duration-300 ease-out ${sizeClasses[size]}`}
            style={{ width: `${normalizedProgress}%` }}
            role="progressbar"
            aria-valuenow={normalizedProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {showLabel && (
          <div className="absolute right-0 -top-6 text-sm font-medium text-gray-600">
            {Math.round(normalizedProgress)}%
          </div>
        )}
      </div>
    </div>
  );
}