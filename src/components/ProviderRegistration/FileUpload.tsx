import React from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { FileUploadState } from '../../types/provider';

interface FileUploadProps {
  state: FileUploadState;
  onChange: (file: File | null) => void;
}

export function FileUpload({ state, onChange }: FileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    if (file) {
      if (file.type !== 'application/pdf') {
        onChange(null);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        onChange(null);
        return;
      }
      
      onChange(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Police Check (PDF only, max 5MB)
        <span className="text-red-500 ml-1">*</span>
      </label>
      
      <div className="relative">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="police-check-upload"
        />
        
        <label
          htmlFor="police-check-upload"
          className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-md cursor-pointer
            ${state.file ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-500'}`}
        >
          <div className="space-y-1 text-center">
            {state.file ? (
              <div className="flex items-center space-x-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">{state.file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-600">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">Click to upload your police check</span>
                <span className="text-xs text-gray-500">PDF up to 5MB</span>
              </div>
            )}
          </div>
        </label>

        {state.error && (
          <div className="mt-2 flex items-center text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
}