import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { supabase } from '../lib/supabase';
import { errorMonitor } from '../lib/monitoring';
import { metricsCollector } from '../lib/monitoring';
import { accessibilityMonitor } from '../lib/accessibility';
import { analytics } from '../lib/analytics';

// Extend Jest matchers
expect.extend({
  toHaveBeenCalledWithMatch(received, ...expected) {
    const pass = vi.mocked(received).mock.calls.some(call =>
      expected.every((arg, i) =>
        typeof arg === 'object'
          ? expect.objectContaining(arg).asymmetricMatch(call[i])
          : arg === call[i]
      )
    );

    return {
      pass,
      message: () =>
        `expected ${received.getMockName()} to have been called with ${expected}`
    };
  }
});

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis()
    })),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn()
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    }))
  }
}));

// Mock monitoring
vi.mock('../lib/monitoring', () => ({
  errorMonitor: {
    logError: vi.fn(),
    logSuccess: vi.fn(),
    getMetrics: vi.fn()
  },
  metricsCollector: {
    recordEvent: vi.fn(),
    getMetrics: vi.fn()
  }
}));

// Mock analytics
vi.mock('../lib/analytics', () => ({
  analytics: {
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
    trackError: vi.fn(),
    trackExperiment: vi.fn()
  }
}));

// Mock accessibility monitor
vi.mock('../lib/accessibility', () => ({
  accessibilityMonitor: {
    runAudit: vi.fn(),
    getViolations: vi.fn(),
    clearViolations: vi.fn()
  }
}));

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Global test environment setup
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  const mockIntersectionObserver = vi.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;

  // Mock ResizeObserver
  const mockResizeObserver = vi.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.ResizeObserver = mockResizeObserver;
});

// Global test environment teardown
afterAll(() => {
  vi.restoreAllMocks();
});