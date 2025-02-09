import React from 'react';
import { Filter } from 'lucide-react';

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  return (
    <div className="relative">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <select
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All Categories</option>
        <option value="walking">Dog Walking</option>
        <option value="grooming">Pet Grooming</option>
        <option value="sitting">Pet Sitting</option>
        <option value="training">Pet Training</option>
      </select>
    </div>
  );
}