import React from 'react';
import { Star } from 'lucide-react';

interface ServiceRatingProps {
  rating: number;
}

export function ServiceRating({ rating }: ServiceRatingProps) {
  return (
    <div className="flex items-center">
      <Star className="w-4 h-4 text-yellow-400" />
      <span className="ml-1 text-sm font-medium text-gray-600">{rating}</span>
    </div>
  );
}