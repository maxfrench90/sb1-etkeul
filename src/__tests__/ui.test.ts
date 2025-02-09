import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ClientDashboard } from '../pages/dashboard/ClientDashboard';
import { ProviderDashboard } from '../pages/dashboard/ProviderDashboard';

describe('UI/UX Tests', () => {
  describe('Loading States', () => {
    it('should show loading state while fetching dashboard data', () => {
      render(
        <BrowserRouter>
          <ClientDashboard />
        </BrowserRouter>
      );
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should display error message when data fetch fails', async () => {
      // Mock failed API call
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('API Error'));

      render(
        <BrowserRouter>
          <ProviderDashboard />
        </BrowserRouter>
      );

      const errorMessage = await screen.findByText(/error/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile view', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      render(
        <BrowserRouter>
          <ClientDashboard />
        </BrowserRouter>
      );
      
      // Check if mobile-specific classes are applied
      const element = screen.getByTestId('dashboard-container');
      expect(element).toHaveClass('md:hidden');
    });
  });
});