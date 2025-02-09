import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '../ui/Button';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onChange: (theme: 'light' | 'dark') => void;
}

export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onChange(theme === 'light' ? 'dark' : 'light')}
      className="flex items-center gap-2"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Sun className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="sr-only">
        {theme === 'light' ? 'Dark' : 'Light'} mode
      </span>
    </Button>
  );
}