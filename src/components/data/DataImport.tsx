import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'custom';
  message: string;
  validate?: (value: any) => boolean;
}

interface DataImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => Promise<void>;
  validationRules?: ValidationRule[];
  allowedFormats?: string[];
  maxFileSize?: number;
}

export function DataImport({
  isOpen,
  onClose,
  onImport,
  validationRules = [],
  allowedFormats = ['.csv', '.json', '.xlsx'],
  maxFileSize = 5 * 1024 * 1024 // 5MB
}: DataImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > maxFileSize) {
      setError(`File size must be less than ${maxFileSize / 1024 / 1024}MB`);
      return;
    }

    // Validate file format
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!allowedFormats.includes(`.${fileExtension}`)) {
      setError(`Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const validateData = (data: any[]) => {
    const errors: string[] = [];

    data.forEach((row, index) => {
      validationRules.forEach(rule => {
        const value = row[rule.field];

        if (rule.type === 'required' && !value) {
          errors.push(`Row ${index + 1}: ${rule.message}`);
        } else if (rule.type === 'format' && value && !rule.validate?.(value)) {
          errors.push(`Row ${index + 1}: ${rule.message}`);
        } else if (rule.type === 'custom' && !rule.validate?.(value)) {
          errors.push(`Row ${index + 1}: ${rule.message}`);
        }
      });
    });

    return errors;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setValidationErrors([]);

    try {
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress((event.loaded / event.total) * 100);
        }
      };

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          let data: any[];

          if (file.name.endsWith('.csv')) {
            data = parseCSV(content);
          } else if (file.name.endsWith('.json')) {
            data = JSON.parse(content);
          } else {
            throw new Error('Unsupported file format');
          }

          // Validate data
          const errors = validateData(data);
          if (errors.length > 0) {
            setValidationErrors(errors);
            return;
          }

          // Import data
          await onImport(data);
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to parse file');
        }
      };

      reader.readAsText(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Import Data"
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                file ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={allowedFormats.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    {allowedFormats.join(', ')} (max {maxFileSize / 1024 / 1024}MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="bg-red-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              Validation Errors
            </h4>
            <ul className="text-sm text-red-600 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {importing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Importing data...</span>
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
            onClick={handleImport}
            disabled={!file || importing || validationErrors.length > 0}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function parseCSV(content: string): any[] {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {} as any);
  });
}