import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { ExportButton } from './ExportButton';
import { Toast } from './ui/Toast';

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

/**
 * @component ExportDemo
 * @description Demonstrates the export functionality with various options and configurations.
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <div>
 *       <ExportDemo />
 *     </div>
 *   );
 * }
 * ```
 */
export function ExportDemo() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Example data for different export scenarios
  const exportScenarios = [
    {
      title: 'All Bookings',
      description: 'Export complete booking history',
      config: {
        tableName: 'bookings',
        csvHeaders: {
          id: 'Booking ID',
          client_name: 'Client Name',
          service_type: 'Service Type',
          booking_date: 'Booking Date',
          status: 'Status',
          amount: 'Amount'
        }
      }
    },
    {
      title: 'Active Bookings',
      description: 'Export only active bookings',
      config: {
        tableName: 'bookings',
        query: {
          filter: { status: 'active' }
        },
        csvHeaders: {
          id: 'Booking ID',
          client_name: 'Client Name',
          service_type: 'Service Type',
          booking_date: 'Booking Date',
          amount: 'Amount'
        }
      }
    },
    {
      title: 'Transaction History',
      description: 'Export financial transactions',
      config: {
        tableName: 'transactions',
        csvHeaders: {
          id: 'Transaction ID',
          date: 'Date',
          description: 'Description',
          amount: 'Amount',
          status: 'Status'
        }
      }
    }
  ];

  const handleExportError = (error: Error) => {
    setToast({
      type: 'error',
      message: error.message
    });
  };

  const handleExportComplete = () => {
    setToast({
      type: 'success',
      message: 'Export completed successfully'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Data</h2>
        <p className="text-gray-600">
          Export your data in JSON or CSV format. Use filters and date ranges to customize your export.
        </p>
      </div>

      {/* Export scenarios */}
      <div className="grid gap-6 mb-8">
        {exportScenarios.map((scenario, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {scenario.title}
                </h3>
                <p className="text-sm text-gray-600">{scenario.description}</p>
              </div>
              <div className="relative group">
                <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
                <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  Click the export button to download data. Use the date range picker to filter by date.
                </div>
              </div>
            </div>

            <ExportButton
              {...scenario.config}
              onError={handleExportError}
              onComplete={handleExportComplete}
              dateField="created_at"
            />
          </div>
        ))}
      </div>

      {/* Export tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">Export Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use CSV format for spreadsheet compatibility</li>
              <li>• JSON format preserves data types and nested structures</li>
              <li>• Date filters help reduce file size for large datasets</li>
              <li>• Custom headers make CSV files more readable</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}