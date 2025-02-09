import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Portal } from './Portal';
import { Button } from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnOutsideClick?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  actions,
  size = 'md',
  closeOnOutsideClick = true
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div
          ref={dialogRef}
          className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} mx-auto`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 id="dialog-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="p-6">{children}</div>

          {actions && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              {actions}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}