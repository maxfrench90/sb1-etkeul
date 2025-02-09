import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { VirtualList } from './VirtualList';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: number;
  sortable?: boolean;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortColumn?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  isLoading,
  className = ''
}: DataTableProps<T>) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSort = (column: keyof T) => {
    if (!onSort || !columns.find(col => col.key === column)?.sortable) return;

    const newDirection = 
      column === sortColumn && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(column, newDirection);
  };

  const renderRow = (item: T) => (
    <tr
      key={item.id}
      className={`border-b border-gray-200 transition-colors ${
        hoveredRow === item.id ? 'bg-gray-50' : ''
      } ${onRowClick ? 'cursor-pointer' : ''}`}
      onClick={() => onRowClick?.(item)}
      onMouseEnter={() => setHoveredRow(item.id)}
      onMouseLeave={() => setHoveredRow(null)}
    >
      {columns.map(column => (
        <td
          key={String(column.key)}
          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          style={column.width ? { width: column.width } : undefined}
        >
          {column.render
            ? column.render(item[column.key], item)
            : String(item[column.key])}
        </td>
      ))}
    </tr>
  );

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer select-none' : ''
                  }`}
                  onClick={() => handleSort(column.key)}
                  style={column.width ? { width: column.width } : undefined}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && (
                      <span className="inline-flex">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500" />
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map(renderRow)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}