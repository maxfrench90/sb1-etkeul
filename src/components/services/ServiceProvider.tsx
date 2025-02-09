import React from 'react';
import { Provider } from '../../types';

interface ServiceProviderProps {
  provider: Provider;
}

export function ServiceProvider({ provider }: ServiceProviderProps) {
  return (
    <div className="flex items-center space-x-2">
      <img
        src={provider.avatar}
        alt={provider.name}
        className="w-8 h-8 rounded-full"
      />
      <div>
        <p className="text-sm font-medium text-gray-900">{provider.name}</p>
        <p className="text-xs text-gray-500">{provider.reviews} reviews</p>
      </div>
    </div>
  );
}