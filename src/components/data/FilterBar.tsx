import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
}

interface FilterGroup {
  id: string;
  label: string;
  type: 'select' | 'multi-select' | 'date-range' | 'boolean';
  options?: FilterOption[];
}

interface FilterBarProps {
  groups: FilterGroup[];
  activeFilters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  className?: string;
}

export function FilterBar({
  groups,
  activeFilters,
  onFilterChange,
  className = ''
}: FilterBarProps) {
  const handleRemoveFilter = (groupId: string, value?: any) => {
    const newFilters = { ...activeFilters };
    
    if (Array.isArray(newFilters[groupId]) && value !== undefined) {
      newFilters[groupId] = newFilters[groupId].filter((v: any) => v !== value);
      if (newFilters[groupId].length === 0) {
        delete newFilters[groupId];
      }
    } else {
      delete newFilters[groupId];
    }
    
    onFilterChange(newFilters);
  };

  const getFilterLabel = (group: FilterGroup, value: any) => {
    if (group.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (group.options) {
      const option = group.options.find(opt => opt.value === value);
      return option?.label || value;
    }
    
    return value;
  };

  const renderActiveFilters = () => {
    return Object.entries(activeFilters).map(([groupId, value]) => {
      const group = groups.find(g => g.id === groupId);
      if (!group) return null;

      if (Array.isArray(value)) {
        return value.map((v) => (
          <Badge
            key={`${groupId}-${v}`}
            variant="default"
            className="flex items-center gap-1"
          >
            {group.label}: {getFilterLabel(group, v)}
            <button
              onClick={() => handleRemoveFilter(groupId, v)}
              className="ml-1 hover:text-gray-700"
              aria-label={`Remove ${group.label} filter`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ));
      }

      return (
        <Badge
          key={groupId}
          variant="default"
          className="flex items-center gap-1"
        >
          {group.label}: {getFilterLabel(group, value)}
          <button
            onClick={() => handleRemoveFilter(groupId)}
            className="ml-1 hover:text-gray-700"
            aria-label={`Remove ${group.label} filter`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      );
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        </div>
        {Object.keys(activeFilters).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange({})}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {renderActiveFilters()}
      </div>
    </div>
  );
}