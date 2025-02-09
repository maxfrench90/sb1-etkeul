import { supabase } from '../lib/supabase';

export type ExportFormat = 'json' | 'csv';

interface ExportOptions {
  tableName: string;
  format: ExportFormat;
  query?: {
    select?: string;
    filter?: Record<string, any>;
    range?: { from: number; to: number };
    dateRange?: {
      field: string;
      start: Date;
      end: Date;
    };
  };
  fileName?: string;
  csvHeaders?: Record<string, string>; // Map database columns to display names
  onProgress?: (progress: number) => void;
}

interface ValidationError extends Error {
  code: 'INVALID_DATE_RANGE' | 'NO_DATA' | 'INVALID_FORMAT';
}

function createValidationError(message: string, code: ValidationError['code']): ValidationError {
  const error = new Error(message) as ValidationError;
  error.code = code;
  return error;
}

function validateDateRange(start: Date, end: Date): void {
  if (start > end) {
    throw createValidationError(
      'Start date must be before or equal to end date',
      'INVALID_DATE_RANGE'
    );
  }

  if (end > new Date()) {
    throw createValidationError(
      'End date cannot be in the future',
      'INVALID_DATE_RANGE'
    );
  }
}

function convertToCSV(
  data: any[],
  customHeaders?: Record<string, string>
): string {
  if (data.length === 0) return '';

  // Get headers from first object
  const columns = Object.keys(data[0]);
  
  // Use custom headers if provided, otherwise use column names
  const headers = customHeaders
    ? columns.map(col => customHeaders[col] || col)
    : columns;
  
  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      columns.map(col => {
        const value = row[col];
        // Handle special cases and escaping
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

/**
 * Exports data from a Supabase table in either JSON or CSV format
 * @param options Export configuration options
 * @returns Promise that resolves when the export is complete
 * @throws ValidationError if the date range or format is invalid
 * @example
 * ```typescript
 * await handleExport({
 *   tableName: 'users',
 *   format: 'csv',
 *   query: {
 *     select: 'id,name,email',
 *     dateRange: {
 *       field: 'created_at',
 *       start: new Date('2024-01-01'),
 *       end: new Date('2024-12-31')
 *     }
 *   },
 *   csvHeaders: {
 *     id: 'ID',
 *     name: 'Full Name',
 *     email: 'Email Address'
 *   },
 *   onProgress: (progress) => console.log(`Export progress: ${progress}%`)
 * });
 * ```
 */
export async function handleExport({ 
  tableName, 
  format,
  query = {}, 
  fileName,
  csvHeaders,
  onProgress
}: ExportOptions): Promise<void> {
  console.log(`Starting ${format} export for table: ${tableName}`);
  
  try {
    // Validate date range if provided
    if (query.dateRange) {
      validateDateRange(query.dateRange.start, query.dateRange.end);
    }

    // Build the query
    let supabaseQuery = supabase
      .from(tableName)
      .select(query.select || '*');

    // Apply filters if provided
    if (query.filter) {
      Object.entries(query.filter).forEach(([key, value]) => {
        supabaseQuery = supabaseQuery.eq(key, value);
      });
    }

    // Apply date range if provided
    if (query.dateRange) {
      const { field, start, end } = query.dateRange;
      supabaseQuery = supabaseQuery
        .gte(field, start.toISOString())
        .lte(field, end.toISOString());
    }

    // Apply range if provided
    if (query.range) {
      supabaseQuery = supabaseQuery.range(
        query.range.from,
        query.range.to
      );
    }

    onProgress?.(10); // Query built

    // Execute the query
    const { data, error } = await supabaseQuery;

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw createValidationError('No data available for export', 'NO_DATA');
    }

    onProgress?.(50); // Data fetched

    console.log(`Successfully fetched ${data.length} records`);

    // Prepare the data based on format
    let blob: Blob;
    let defaultFileName: string;

    if (format === 'csv') {
      const csvContent = convertToCSV(data, csvHeaders);
      blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      defaultFileName = `${tableName}_export.csv`;
    } else if (format === 'json') {
      const jsonString = JSON.stringify(data, null, 2);
      blob = new Blob([jsonString], { type: 'application/json' });
      defaultFileName = `${tableName}_export.json`;
    } else {
      throw createValidationError(`Unsupported format: ${format}`, 'INVALID_FORMAT');
    }
    
    onProgress?.(75); // Export file created

    // Create download link and trigger download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || defaultFileName;
    
    // Append to body, click, and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    onProgress?.(100); // Download complete
    console.log('Export completed successfully');
  } catch (err) {
    console.error('Export failed:', err);
    throw err;
  }
}