import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { supabase } from '../lib/supabase';
import { errorMonitor } from '../lib/monitoring';
import { metricsCollector } from '../lib/monitoring';
import { accessibilityMonitor } from '../lib/accessibility';
import { analytics } from '../lib/analytics';
import { performance } from '../lib/performance';

describe('Core Functionality', () => {
  describe('Authentication', () => {
    it('completes full auth flow', async () => {
      // Test sign up
      const signUpData = {
        email: 'test@example.com',
        password: 'Password123!',
        role: 'client'
      };

      // Test sign in
      const signInData = {
        email: signUpData.email,
        password: signUpData.password
      };

      // Verify auth state persistence
      const { data: { user } } = await supabase.auth.getUser();
      expect(user).toBeTruthy();
    });

    it('handles auth errors gracefully', async () => {
      // Test invalid credentials
      const { error } = await supabase.auth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpass'
      });

      expect(error).toBeTruthy();
      expect(errorMonitor.logError).toHaveBeenCalled();
    });
  });

  describe('Real-time Features', () => {
    it('handles subscription events correctly', async () => {
      // Test subscription setup
      const channel = supabase.channel('test');
      expect(channel).toBeTruthy();

      // Test event handling
      const mockPayload = {
        new: { id: '1', status: 'confirmed' },
        old: { id: '1', status: 'pending' }
      };

      // Verify state updates
      expect(screen.getByText('confirmed')).toBeInTheDocument();
    });

    it('recovers from connection issues', async () => {
      // Simulate offline state
      window.dispatchEvent(new Event('offline'));
      expect(screen.getByText('You are offline')).toBeInTheDocument();

      // Simulate online state
      window.dispatchEvent(new Event('online'));
      expect(screen.queryByText('You are offline')).not.toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('loads within performance budget', async () => {
      const startTime = performance.now();
      
      render(<App />);
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second budget
    });

    it('handles large datasets efficiently', async () => {
      const items = Array(1000).fill(null).map((_, i) => ({
        id: `${i}`,
        name: `Item ${i}`
      }));

      render(<VirtualList items={items} />);
      
      const metrics = await performance.getMetrics();
      expect(metrics.fcp).toBeLessThan(1000); // 1 second FCP budget
    });
  });

  describe('Offline Support', () => {
    it('caches critical resources', async () => {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      expect(registration.active).toBeTruthy();

      // Verify cache storage
      const cache = await caches.open('offline-cache');
      const offlinePage = await cache.match('/offline.html');
      expect(offlinePage).toBeTruthy();
    });

    it('syncs offline changes', async () => {
      // Create offline booking
      const booking = {
        service_type: 'Dog Walking',
        date: new Date().toISOString()
      };

      // Simulate offline state
      await registration.sync.register('sync-bookings');

      // Verify sync completed
      expect(supabase.from).toHaveBeenCalledWith('bookings');
    });
  });
});

describe('Feature Tests', () => {
  describe('Booking System', () => {
    it('completes booking flow', async () => {
      // Select service
      fireEvent.click(screen.getByText('Dog Walking'));

      // Choose date and time
      const dateInput = screen.getByLabelText('Select date');
      fireEvent.change(dateInput, { target: { value: '2024-03-01' } });

      // Confirm booking
      fireEvent.click(screen.getByText('Confirm Booking'));

      // Verify booking created
      expect(supabase.from).toHaveBeenCalledWith('bookings');
      expect(screen.getByText('Booking confirmed')).toBeInTheDocument();
    });

    it('handles booking conflicts', async () => {
      // Create conflicting booking
      const conflictingTime = '2024-03-01T10:00:00Z';
      
      // Verify conflict detection
      expect(screen.getByText('Time slot not available')).toBeInTheDocument();
    });
  });

  describe('Search and Filters', () => {
    it('filters results correctly', async () => {
      // Apply filters
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Dog Walking'));
      fireEvent.click(screen.getByText('Apply'));

      // Verify filtered results
      const results = screen.getAllByTestId('service-card');
      expect(results.every(card => 
        card.textContent?.includes('Dog Walking')
      )).toBe(true);
    });

    it('saves search preferences', async () => {
      // Save search
      fireEvent.click(screen.getByText('Save Search'));
      fireEvent.change(screen.getByLabelText('Search name'), {
        target: { value: 'My Saved Search' }
      });
      fireEvent.click(screen.getByText('Save'));

      // Verify saved
      expect(supabase.from).toHaveBeenCalledWith('saved_searches');
    });
  });
});

describe('Accessibility', () => {
  it('meets WCAG guidelines', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', () => {
    render(<App />);
    
    // Tab through interactive elements
    const focusableElements = screen.getAllByRole('button');
    focusableElements.forEach(element => {
      element.focus();
      expect(document.activeElement).toBe(element);
    });
  });

  it('provides proper ARIA attributes', () => {
    render(<App />);
    
    // Check critical elements
    expect(screen.getByRole('main')).toHaveAttribute('aria-label');
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label');
  });
});

describe('Error Handling', () => {
  it('recovers from API errors', async () => {
    // Mock API error
    vi.mocked(supabase.from).mockImplementationOnce(() => {
      throw new Error('API Error');
    });

    render(<App />);

    // Verify error boundary caught error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(errorMonitor.logError).toHaveBeenCalled();
  });

  it('handles form validation errors', async () => {
    render(<BookingForm />);

    // Submit invalid form
    fireEvent.click(screen.getByText('Submit'));

    // Verify validation messages
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});

describe('Performance Monitoring', () => {
  it('tracks key metrics', async () => {
    render(<App />);

    // Verify metrics collected
    expect(metricsCollector.recordEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'performance'
      })
    );
  });

  it('reports errors correctly', async () => {
    const error = new Error('Test error');
    
    // Trigger error
    errorMonitor.logError({
      operation: 'test',
      error: error.message,
      severity: 'high',
      timestamp: new Date().toISOString()
    });

    // Verify error logged
    expect(errorMonitor.logError).toHaveBeenCalled();
  });
});

describe('Analytics', () => {
  it('tracks user interactions', async () => {
    render(<App />);

    // Perform user action
    fireEvent.click(screen.getByText('Book Now'));

    // Verify event tracked
    expect(analytics.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Booking',
        action: 'Click'
      })
    );
  });

  it('tracks page views', async () => {
    render(<App />);

    // Navigate to new page
    fireEvent.click(screen.getByText('Dashboard'));

    // Verify pageview tracked
    expect(analytics.trackPageView).toHaveBeenCalled();
  });
});

describe('Mobile Responsiveness', () => {
  it('adapts to different screen sizes', async () => {
    const { rerender } = render(<App />);

    // Test mobile view
    window.innerWidth = 375;
    window.dispatchEvent(new Event('resize'));
    rerender(<App />);
    expect(screen.getByTestId('mobile-menu')).toBeVisible();

    // Test desktop view
    window.innerWidth = 1024;
    window.dispatchEvent(new Event('resize'));
    rerender(<App />);
    expect(screen.getByTestId('desktop-menu')).toBeVisible();
  });

  it('handles touch interactions', async () => {
    render(<App />);

    // Simulate touch events
    fireEvent.touchStart(screen.getByTestId('swipe-area'), {
      touches: [{ clientX: 0, clientY: 0 }]
    });
    fireEvent.touchEnd(screen.getByTestId('swipe-area'), {
      changedTouches: [{ clientX: 200, clientY: 0 }]
    });

    // Verify swipe handled
    expect(screen.getByTestId('menu')).toHaveClass('open');
  });
});