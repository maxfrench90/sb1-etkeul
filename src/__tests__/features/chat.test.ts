import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useChat } from '../../hooks/useChat';
import { supabase } from '../../lib/supabase';

describe('Real-time Chat', () => {
  it('delivers messages under varying network conditions', async () => {
    const { result } = renderHook(() => useChat());
    
    // Test normal conditions
    await act(async () => {
      await result.current.sendMessage('test message');
    });
    expect(result.current.messages).toContainEqual(
      expect.objectContaining({ content: 'test message' })
    );

    // Test slow network
    vi.useFakeTimers();
    const slowPromise = result.current.sendMessage('slow message');
    vi.advanceTimersByTime(5000);
    await slowPromise;
    
    expect(result.current.messages).toContainEqual(
      expect.objectContaining({ content: 'slow message' })
    );
  });

  it('handles offline/online transitions', async () => {
    const { result } = renderHook(() => useChat());
    
    // Go offline
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current.isOnline).toBe(false);

    // Queue message while offline
    await act(async () => {
      await result.current.sendMessage('offline message');
    });

    // Go online and verify message sent
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current.messages).toContainEqual(
      expect.objectContaining({ content: 'offline message' })
    );
  });
});