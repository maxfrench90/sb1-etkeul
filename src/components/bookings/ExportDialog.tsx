import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { format } from 'date-fns';
import type { Booking } from '../../types';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  userRole: 'client' | 'provider';
  onExport: (format: 'csv' | 'pdf', dateRange: string, fields: string[]) => void;
}

interface ExportField {
  id: keyof Booking;
  label: string;
  default: boolean;
}

const EXPORT_FIELDS: ExportField[] = [
  { id: 'start_time', label: 'Date', default: true },
  { id: 'service_type', label: 'Service Type', default: true },
  { id: 'status', label: 'Status', default: true },
  { id: 'end_time', label: 'End Time', default: false },
  { id: 'created_at', label: 'Created At', default: false }
];

export function ExportDialog({ isOpen, onClose, bookings, userRole, onExport }: ExportDialogProps) {
  const [dateRange, setDateRange] = useState('all');
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.filter(field => field.default).map(field => field.id)
  );
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(format, dateRange, selectedFields);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Export Bookings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="thisYear">This Year</option>
            </select>
          </div>

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
                variant={format === 'pdf' ? 'default' : 'outline'}
                onClick={() => setFormat('pdf')}
                className="flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fields to Export
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {EXPORT_FIELDS.map((field) => (
                <label key={field.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.id)}
                    onChange={() => {
                      setSelectedFields(prev =>
                        prev.includes(field.id)
                          ? prev.filter(id => id !== field.id)
                          : [...prev, field.id]
                      );
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedFields.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export {format.toUpperCase()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}