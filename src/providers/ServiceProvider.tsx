import React, { createContext, useContext } from 'react';
import { AuthService, BookingService, ProviderService } from '../services';
import { useStore } from '../store';

interface Services {
  auth: AuthService;
  booking: BookingService;
  provider: ProviderService;
}

const ServiceContext = createContext<Services | undefined>(undefined);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
  const services = {
    auth: new AuthService(),
    booking: new BookingService(),
    provider: new ProviderService()
  };

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
}