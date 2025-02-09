import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../providers/AuthProvider';
import { CollaborationProvider } from '../../components/collaboration/CollaborationProvider';
import { ExperimentProvider } from '../../components/experiments/ExperimentProvider';
import { AccessibilityProvider } from '../../components/accessibility/AccessibilityProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0
    }
  }
});

interface WrapperProps {
  children: React.ReactNode;
}

function AllTheProviders({ children }: WrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CollaborationProvider>
          <ExperimentProvider>
            <AccessibilityProvider>
              <BrowserRouter>
                {children}
              </BrowserRouter>
            </AccessibilityProvider>
          </ExperimentProvider>
        </CollaborationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Test data generators
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    role: 'client'
  }
};

export const mockBooking = {
  id: 'test-booking-id',
  client_id: mockUser.id,
  provider_id: 'test-provider-id',
  service_type: 'Dog Walking',
  start_time: '2024-03-01T10:00:00Z',
  end_time: '2024-03-01T11:00:00Z',
  status: 'pending',
  created_at: '2024-02-29T10:00:00Z',
  updated_at: '2024-02-29T10:00:00Z'
};

export const mockProvider = {
  id: 'test-provider-id',
  email: 'provider@example.com',
  full_name: 'Test Provider',
  role: 'provider',
  rating: 4.8,
  reviews: 156,
  verified: true
};

// Test utilities
export function mockAuthenticatedUser() {
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: mockUser },
    error: null
  });
}

export function mockSuccessfulQuery(data: any) {
  vi.mocked(supabase.from).mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error: null })
  }));
}

export function mockFailedQuery(error: string) {
  vi.mocked(supabase.from).mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: null, error: new Error(error) })
  }));
}