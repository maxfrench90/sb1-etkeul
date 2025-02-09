import React, { useState } from 'react';
import { VirtualList } from '../ui/VirtualList';
import { DataTable } from '../ui/DataTable';
import { FilterBar } from './FilterBar';
import { SortBar } from './SortBar';
import { SearchBar } from './SearchBar';
import { Pagination } from '../ui/Pagination';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Database } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: number;
  sortable?: boolean;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface FilterGroup {
  id: string;
  label: string;
  type: 'select' | 'multi-select' | 'date-range' | 'boolean';
  options?: Array<{ id: string; label: string; value: any }>;
}

interface SortOption {
  id: string;
  label: string;
}

interface DataGridProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  filterGroups?: FilterGroup[];
  sortOptions?: SortOption[];
  isLoading?: boolean;
  totalItems?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  onSortChange?: (sort: { field: string; direction: 'asc' | 'desc' } | null) => void;
  onSearch?: (query: string) => void;
  onRowClick?: (item: T) => void;
  emptyStateProps?: {
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  className?: string;
}

export function DataGrid<T extends { id: string }>({
  data,
  columns,
  filterGroups,
  sortOptions,
  isLoading,
  totalItems = 0,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  onFilterChange,
  onSortChange,
  onSearch,
  onRowClick,
  emptyStateProps,
  className = ''
}: DataGridProps<T>) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [activeSort, setActiveSort] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);

  const handleFilterChange = (filters: Record<string, any>) => {
    setActiveFilters(filters);
    onFilterChange?.(filters);
  };

  const handleSortChange = (sort: { field: string; direction: 'asc' | 'desc' } | null) => {
    setActiveSort(sort);
    onSortChange?.(sort);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {onSearch && (
          <div className="w-full sm:w-72">
            <SearchBar
              onSearch={onSearch}
              placeholder="Search..."
              debounceMs={300}
            />
          </div>
        )}
        
        {sortOptions && (
          <SortBar
            options={sortOptions}
            activeSort={activeSort}
            onSortChange={handleSortChange}
          />
        )}
      </div>

      {filterGroups && (
        <FilterBar
          groups={filterGroups}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
        />
      )}

      {data.length === 0 && !isLoading ? (
        <EmptyState
          icon={Database}
          title={emptyStateProps?.title || 'No data available'}
          description={emptyStateProps?.description || 'Try adjusting your filters or search criteria'}
          action={emptyStateProps?.action}
        />
      ) : (
        <DataTable
          data={data}
          columns={columns}
          sortColumn={activeSort?.field}
          sortDirection={activeSort?.direction}
          onSort={onSortChange ? handleSortChange : undefined}
          onRowClick={onRowClick}
          isLoading={isLoading}
        />
      )}

      {totalPages > 1 && onPageChange && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}