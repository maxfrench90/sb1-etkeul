import { describe, it, expect, vi } from 'vitest';
import { handleExport } from '../utils/exportData';
import { supabase } from '../lib/supabase';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(),
        gte: vi.fn(),
        lte: vi.fn(),
        range: vi.fn(),
      })),
    })),
  },
}));

describe('Export Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('validates date range correctly', async () => {
    const invalidDateRange = {
      start: new Date('2024-12-31'),
      end: new Date('2024-01-01'),
    };

    await expect(handleExport({
      tableName: 'test',
      format: 'json',
      query: {
        dateRange: {
          field: 'created_at',
          ...invalidDateRange
        }
      }
    })).rejects.toThrow('Start date must be before or equal to end date');
  });

  it('converts data to CSV format with custom headers', async () => {
    const mockData = [
      { id: 1, name: 'Test', email: 'test@example.com' }
    ];

    const customHeaders = {
      id: 'ID',
      name: 'Full Name',
      email: 'Email Address'
    };

    // Mock successful response
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: mockData, error: null })
      })
    }));

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    await handleExport({
      tableName: 'test',
      format: 'csv',
      csvHeaders: customHeaders
    });

    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('handles progress updates correctly', async () => {
    const onProgress = vi.fn();
    const mockData = [{ id: 1 }];

    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: mockData, error: null })
      })
    }));

    await handleExport({
      tableName: 'test',
      format: 'json',
      onProgress
    });

    expect(onProgress).toHaveBeenCalledWith(10);
    expect(onProgress).toHaveBeenCalledWith(50);
    expect(onProgress).toHaveBeenCalledWith(75);
    expect(onProgress).toHaveBeenCalledWith(100);
  });

  it('throws error when no data is available', async () => {
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null })
      })
    }));

    await expect(handleExport({
      tableName: 'test',
      format: 'json'
    })).rejects.toThrow('No data available for export');
  });
});