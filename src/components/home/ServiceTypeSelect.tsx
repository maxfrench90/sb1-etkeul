import React from 'react';
import { Filter } from 'lucide-react';

export function ServiceTypeSelect() {
  return (
    <div className="relative flex-1">
      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <select className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white">
        <option value="">Select service type</option>
        <option value="walking">Dog Walking</option>
        <option value="grooming">Pet Grooming</option>
        <option value="sitting">Pet Sitting</option>
        <option value="training">Pet Training</option>
        <option value="daycare">Pet Daycare</option>
      </select>
    </div>
  );
}