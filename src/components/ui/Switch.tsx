import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  className = ''
}: SwitchProps) {
  return (
    <label className={`relative inline-flex items-start ${className}`}>
      <div className="flex items-center h-6">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked ? 'bg-emerald-600' : 'bg-gray-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </div>
      </div>
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span className={`text-sm font-medium text-gray-900 ${
              disabled ? 'opacity-50' : ''
            }`}>
              {label}
            </span>
          )}
          {description && (
            <p className={`text-sm text-gray-500 ${
              disabled ? 'opacity-50' : ''
            }`}>
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  );
}