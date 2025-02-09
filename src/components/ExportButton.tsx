import React, { useState } from 'react';
import { Download, ChevronDown, Calendar, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { handleExport, ExportFormat } from '../utils/exportData';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface ExportButtonProps {
  tableName: string;
  query?: {
    select?: string;
    filter?: Record<string, any>;
    range?: { from: number; to: number };
  };
  dateField?: string;
  fileName?: string;
  csvHeaders?: Record<string, string>;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function ExportButton({ 
  tableName, 
  query,
  dateField = 'created_at',
  fileName,
  csvHeaders,
  onError,
  onComplete
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null
  });

  // Validate date range
  const isDateRangeValid = !dateRange.start || !dateRange.end || dateRange.start <= dateRange.end;
  const isEndDateValid = !dateRange.end || dateRange.end <= new Date();

  const handleExportClick = async () => {
    if (!isDateRangeValid || !isEndDateValid) {
      onError?.(new Error('Invalid date range'));
      return;
    }

    setLoading(true);
    setProgress(0);
    
    try {
      const exportQuery = {
        ...query,
        ...(dateRange.start && dateRange.end && {
          dateRange: {
            field: dateField,
            start: dateRange.start,
            end: dateRange.end
          }
        })
      };

      await handleExport({
        tableName,
        format,
        query: exportQuery,
        fileName: fileName || `${tableName}_export.${format}`,
        csvHeaders,
        onProgress: setProgress
      });

      onComplete?.();
    } catch (err) {
      console.error('Export failed:', err);
      onError?.(err instanceof Error ? err : new Error('Export failed'));
    } finally {
      setLoading(false);
      setProgress(0);
      setShowOptions(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Button
          onClick={() => setShowOptions(!showOptions)}
          variant="outline"
          className="flex items-center gap-2"
          disabled={loading}
          aria-haspopup="true"
          aria-expanded={showOptions}
          aria-label="Export options"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="w-4 h-4" aria-hidden="true" />
          )}
          {loading ? `Exporting (${progress}%)` : 'Export'}
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>

      {showOptions && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10"
          role="dialog"
          aria-label="Export options dialog"
        >
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="export-format" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Format
              </label>
              <select
                id="export-format"
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500"
                aria-label="Select export format"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
                  <DatePicker
                    selected={dateRange.start}
                    onChange={(date) => setDateRange({ ...dateRange, start: date })}
                    selectsStart
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    maxDate={dateRange.end || new Date()}
                    placeholderText="Start Date"
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${
                      !isDateRangeValid ? 'border-red-300' : 'border-gray-300'
                    }`}
                    aria-label="Select start date"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden="true" />
                  <DatePicker
                    selected={dateRange.end}
                    onChange={(date) => setDateRange({ ...dateRange, end: date })}
                    selectsEnd
                    startDate={dateRange.start}
                    endDate={dateRange.end}
                    minDate={dateRange.start}
                    maxDate={new Date()}
                    placeholderText="End Date"
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-emerald-500 focus:border-emerald-500 ${
                      !isDateRangeValid || !isEndDateValid ? 'border-red-300' : 'border-gray-300'
                    }`}
                    aria-label="Select end date"
                  />
                </div>
              </div>
              {(!isDateRangeValid || !isEndDateValid) && (
                <p className="mt-1 text-sm text-red-500" role="alert">
                  {!isDateRangeValid
                    ? 'Start date must be before end date'
                    : 'End date cannot be in the future'}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowOptions(false)}
                size="sm"
                aria-label="Cancel export"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExportClick}
                disabled={loading || !isDateRangeValid || !isEndDateValid}
                size="sm"
                aria-label={loading ? 'Exporting data...' : 'Export data'}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Exporting...
                  </span>
                ) : (
                  'Export'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}