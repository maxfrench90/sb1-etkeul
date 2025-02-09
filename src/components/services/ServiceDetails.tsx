import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { Location } from '../../types';

interface ServiceDetailsProps {
  location: Location;
  duration: number;
}

export function ServiceDetails({ location, duration }: ServiceDetailsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center text-sm text-gray-500">
        <MapPin className="w-4 h-4 mr-2" />
        {location.address}
      </div>
      <div className="flex items-center text-sm text-gray-500">
        <Clock className="w-4 h-4 mr-2" />
        {duration} minutes
      </div>
    </div>
  );
}