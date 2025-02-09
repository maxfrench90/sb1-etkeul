import React, { useState } from 'react';
import { Service } from '../../types';
import { Button } from '../ui/Button';
import { ServiceProvider } from './ServiceProvider';
import { ServiceRating } from './ServiceRating';
import { ServiceDetails } from './ServiceDetails';
import { BookingModal } from '../booking/BookingModal';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="aspect-w-16 aspect-h-9 relative">
          <img
            src={service.provider.avatar}
            alt={service.title}
            className="w-full h-48 object-cover"
          />
        </div>
        
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{service.description}</p>
            </div>
            <ServiceRating rating={service.rating} />
          </div>

          <div className="mt-4">
            <ServiceDetails location={service.location} duration={service.duration} />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <ServiceProvider provider={service.provider} />
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">${service.price}</p>
              <Button 
                onClick={() => setIsBookingModalOpen(true)} 
                variant="default" 
                size="sm" 
                className="mt-2"
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        provider={{
          id: service.provider.id,
          name: service.provider.name,
          serviceType: service.title,
          location: service.location.address,
          price: service.price
        }}
      />
    </>
  );
}