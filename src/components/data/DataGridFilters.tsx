import React from 'react';
import { DateRangePicker } from '../ui/DateRangePicker';
import { Switch } from '../ui/Switch';
import { Combobox } from '../ui/Combobox';

interface FilterConfig {
  id: string;
  type: 'select' | 'multi-select' | 'date-range' | 'boolean';
  label: string;
  options?: Array<{ value: string; label: string }>;
}

interface DataGridFiltersProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  className?: string;
}

export function DataGridFilters({
  filters,
  values,
  onChange,
  className = ''
}: DataGridFiltersProps) {
  const handleFilterChange = (id: string, value: any) => {
    onChange({
      ...values,
      [id]: value
    });
  };

  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
        return (
          <Combobox
            options={filter.options || []}
            value={values[filter.id] || ''}
            onChange={(value) => handleFilterChange(filter.id, value)}
            placeholder={`Select ${filter.label.toLowerCase()}`}
          />
        );
      
      case 'date-range':
        return (
          <DateRangePicker
            startDate={values[filter.id]?.start || null}
            endDate={values[filter.id]?.end || null}
            onChange={([start, end]) => 
              handleFilterChange(filter.id, { start, end })
            }
          />
        );
      
      case 'boolean':
        return (
          <Switch
            checked={values[filter.id] || false}
            onChange={(checked) => handleFilterChange(filter.id, checked)}
            label={filter.label}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {filters.map((filter) => (
        <div key={filter.id} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {filter.label}
          </label>
          {renderFilter(filter)}
        </div>
      ))}
    </div>
  );
}