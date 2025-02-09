import { renderHook, act } from '@testing-library/react-hooks';
import { useRealtimeSubscription } from '../useRealtimeSubscription';
import { supabase } from '../../lib/supabase';
import { queryCache } from '../../lib/cache';

// Mock Supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockImplementation(cb => {
        cb('SUBSCRIBED');
        return {
          unsubscribe: vi.fn()
        };
      })
    })),
    removeChannel: vi.fn()
  }
}));

describe('useRealtimeSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCache.clearAll();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles batch updates correctly', async () => {
    const onInsert = vi.fn();
    const { result } = renderHook(() => 
      useRealtimeSubscription({
        table: 'test',
        batchSize: 2,
        batchInterval: 1000,
        onInsert
      })
    );

    // Simulate two rapid inserts
    act(() => {
      const channel = supabase.channel().on().subscribe();
      channel.emit('INSERT', { new: { id: '1' } });
      channel.emit('INSERT', { new: { id: '2' } });
    });

    // Batch should be processed immediately when size is reached
    expect(onInsert).toHaveBeenCalledWith([
      { id: '1' },
      { id: '2' }
    ]);
  });

  it('handles offline mode correctly', async () => {
    const onInsert = vi.fn();
    const onConnectionChange = vi.fn();

    const { result } = renderHook(() => 
      useRealtimeSubscription({
        table: 'test',
        onInsert,
        onConnectionChange
      })
    );

    // Simulate going offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(onConnectionChange).toHaveBeenCalledWith('DISCONNECTED');
    expect(result.current.isOnline).toBe(false);

    // Simulate changes while offline
    act(() => {
      const channel = supabase.channel().on().subscribe();
      channel.emit('INSERT', { new: { id: '1' } });
    });

    // Changes should be queued
    expect(onInsert).not.toHaveBeenCalled();

    // Simulate coming back online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(onConnectionChange).toHaveBeenCalledWith('CONNECTED');
    expect(result.current.isOnline).toBe(true);

    // Queued changes should be processed
    expect(onInsert).toHaveBeenCalled();
  });

  it('uses custom cache update logic', async () => {
    const customCacheUpdate = vi.fn((type, data, currentCache) => {
      if (type === 'INSERT') {
        return [...currentCache, ...(Array.isArray(data) ? data : [data])];
      }
      return currentCache;
    });

    const { result } = renderHook(() => 
      useRealtimeSubscription({
        table: 'test',
        customCacheUpdate
      })
    );

    act(() => {
      const channel = supabase.channel().on().subscribe();
      channel.emit('INSERT', { new: { id: '1' } });
    });

    expect(customCacheUpdate).toHaveBeenCalled();
  });
});