import React from 'react';
import { MapPin } from 'lucide-react';

export function LocationSearch() {
  return (
    <div className="relative flex-1">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Enter your location"
        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      />
    </div>
  );
}