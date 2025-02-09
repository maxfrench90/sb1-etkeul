import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-offset-white',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus-visible:ring-offset-white',
    ghost: 'hover:bg-gray-100 text-gray-700 focus-visible:ring-offset-white'
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5 rounded-md',
    md: 'text-base px-4 py-2 rounded-lg',
    lg: 'text-lg px-6 py-3 rounded-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
      aria-disabled={props.disabled}
    >
      {children}
    </button>
  );
}