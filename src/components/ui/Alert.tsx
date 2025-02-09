import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  className?: string;
}

export function Alert({
  type,
  title,
  message,
  action,
  onClose,
  className = ''
}: AlertProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  };

  const styles = {
    success: 'bg-green-50 text-green-800',
    error: 'bg-red-50 text-red-800',
    info: 'bg-blue-50 text-blue-800',
    warning: 'bg-amber-50 text-amber-800'
  };

  return (
    <div
      className={`rounded-md p-4 ${styles[type]} ${className}`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {message && (
            <div className="mt-2 text-sm">
              <p>{message}</p>
            </div>
          )}
          {action && (
            <div className="mt-4">
              <button
                type="button"
                onClick={action.onClick}
                className={`text-sm font-medium underline hover:opacity-80`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex hover:opacity-80"
            >
              <span className="sr-only">Dismiss</span>
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}