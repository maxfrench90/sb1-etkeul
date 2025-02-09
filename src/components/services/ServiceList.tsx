import React from 'react';
import { Service } from '../../types';
import { ServiceCard } from './ServiceCard';

interface ServiceListProps {
  services: Service[];
  onBook: (service: Service) => void;
}

export function ServiceList({ services, onBook }: ServiceListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onBook={() => onBook(service)}
        />
      ))}
    </div>
  );
}