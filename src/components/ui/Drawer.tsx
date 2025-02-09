import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Portal } from './Portal';
import { Button } from './Button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md'
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

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

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  const positionClasses = {
    left: 'left-0',
    right: 'right-0'
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          />
          
          <div
            className={`fixed inset-y-0 ${positionClasses[position]} flex max-w-full`}
          >
            <div className={`w-screen ${sizes[size]}`}>
              <div
                ref={drawerRef}
                className="flex h-full flex-col bg-white shadow-xl"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}