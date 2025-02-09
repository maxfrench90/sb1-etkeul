import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, X } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { handleExport } from '../../utils/exportData';

interface DataExportProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  filename?: string;
  columns: Array<{
    key: string;
    label: string;
    exportable?: boolean;
  }>;
}

export function DataExport({
  isOpen,
  onClose,
  data,
  filename = 'export',
  columns
}: DataExportProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.filter(col => col.exportable !== false).map(col => col.key)
  );
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  const handleExportClick = async () => {
    setExporting(true);
    setProgress(0);

    try {
      await handleExport({
        data: data.map(item => {
          const exportItem: Record<string, any> = {};
          selectedColumns.forEach(key => {
            exportItem[key] = item[key];
          });
          return exportItem;
        }),
        format,
        filename: `${filename}.${format}`,
        onProgress: setProgress
      });

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export Data"
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={format === 'csv' ? 'default' : 'outline'}
              onClick={() => setFormat('csv')}
              className="flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </Button>
            <Button
              variant={format === 'json' ? 'default' : 'outline'}
              onClick={() => setFormat('json')}
              className="flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              JSON
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Columns to Export
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {columns.map(column => (
              <label key={column.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column.key)}
                  onChange={(e) => {
                    setSelectedColumns(prev =>
                      e.target.checked
                        ? [...prev, column.key]
                        : prev.filter(key => key !== column.key)
                    );
                  }}
                  disabled={column.exportable === false}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {column.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {exporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Exporting data...</span>
              <span className="text-gray-900 font-medium">{progress}%</span>
            </div>
            <ProgressBar progress={progress} />
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExportClick}
            disabled={exporting || selectedColumns.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export {format.toUpperCase()}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}