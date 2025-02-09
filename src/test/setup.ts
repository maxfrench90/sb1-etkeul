import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }))
  }
}));

// Mock monitoring
vi.mock('../lib/monitoring', () => ({
  errorMonitor: {
    logError: vi.fn(),
    logSuccess: vi.fn()
  },
  metricsCollector: {
    recordEvent: vi.fn()
  }
}));

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});