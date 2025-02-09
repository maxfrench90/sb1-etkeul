import React from 'react';
import { Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface FilterMultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
}

export function FilterMultiSelect({ options, selected, onChange, label }: FilterMultiSelectProps) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="bg-white border border-gray-300 rounded-md shadow-sm">
        <div className="p-2 space-y-1">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                checked={selected.includes(option.value)}
                onChange={(e) => {
                  const newSelected = e.target.checked
                    ? [...selected, option.value]
                    : selected.filter(v => v !== option.value);
                  onChange(newSelected);
                }}
              />
              <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              {selected.includes(option.value) && (
                <Check className="ml-auto h-4 w-4 text-emerald-600" />
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}