import React from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';

interface SortOption {
  id: string;
  label: string;
}

interface SortBarProps {
  options: SortOption[];
  activeSort: { field: string; direction: 'asc' | 'desc' } | null;
  onSortChange: (sort: { field: string; direction: 'asc' | 'desc' } | null) => void;
  className?: string;
}

export function SortBar({
  options,
  activeSort,
  onSortChange,
  className = ''
}: SortBarProps) {
  const handleSort = (field: string) => {
    if (!activeSort || activeSort.field !== field) {
      onSortChange({ field, direction: 'asc' });
    } else {
      onSortChange(
        activeSort.direction === 'asc'
          ? { field, direction: 'desc' }
          : null
      );
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.id}
            variant={activeSort?.field === option.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort(option.id)}
            className="flex items-center gap-1"
          >
            {option.label}
            {activeSort?.field === option.id && (
              activeSort.direction === 'asc' ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}