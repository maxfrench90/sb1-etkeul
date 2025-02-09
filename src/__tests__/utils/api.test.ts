import { describe, it, expect, vi } from 'vitest';
import { createApiClient } from '../../utils/api';
import { supabase } from '../../lib/supabase';
import { errorMonitor } from '../../lib/monitoring';

describe('API Client', () => {
  const api = createApiClient<{ id: string; name: string }>('test');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches with filters and sorting', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValueOnce({
          data: mockData,
          error: null
        })
      }));

      const result = await api.getAll({
        filters: { status: 'active' },
        sort: { column: 'name', direction: 'asc' }
      });

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('test');
    });

    it('handles fetch errors', async () => {
      const error = new Error('Fetch failed');
      vi.mocked(supabase.from).mockImplementationOnce(() => {
        throw error;
      });

      await expect(api.getAll()).resolves.toEqual([]);
      expect(errorMonitor.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'test.getAll',
          error: error.message
        })
      );
    });
  });

  describe('create', () => {
    it('creates record with retry', async () => {
      const mockData = { id: '1', name: 'Test' };
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({
          data: mockData,
          error: null
        })
      }));

      const result = await api.create({ name: 'Test' });
      expect(result).toEqual(mockData);
    });
  });

  describe('subscribe', () => {
    it('sets up real-time subscription', () => {
      const mockCallback = vi.fn();
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      };

      vi.mocked(supabase.channel).mockReturnValueOnce(mockChannel);

      const unsubscribe = api.subscribe(mockCallback);
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();

      unsubscribe();
      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });
});