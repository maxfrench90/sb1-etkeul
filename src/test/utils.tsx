import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../providers/AuthProvider';
import { CollaborationProvider } from '../components/collaboration/CollaborationProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
});

export function renderWithProviders(ui: React.ReactNode) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CollaborationProvider>
          <BrowserRouter>
            {ui}
          </BrowserRouter>
        </CollaborationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export * from '@testing-library/react';