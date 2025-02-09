import React from 'react';
import { Button } from '../ui/Button';
import { Download, Filter, Plus, Upload } from 'lucide-react';

interface DataGridToolbarProps {
  onAdd?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onFilterToggle?: () => void;
  showFilters?: boolean;
  className?: string;
}

export function DataGridToolbar({
  onAdd,
  onImport,
  onExport,
  onFilterToggle,
  showFilters,
  className = ''
}: DataGridToolbarProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        {onAdd && (
          <Button
            onClick={onAdd}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        )}
        
        {onFilterToggle && (
          <Button
            variant="outline"
            onClick={onFilterToggle}
            className={`flex items-center gap-2 ${showFilters ? 'bg-gray-100' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onImport && (
          <Button
            variant="outline"
            onClick={onImport}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
        )}
        
        {onExport && (
          <Button
            variant="outline"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        )}
      </div>
    </div>
  );
}